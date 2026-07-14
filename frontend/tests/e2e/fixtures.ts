import { test as base } from "@playwright/test";
import { execSync, spawn } from "child_process";
import { rm } from "fs/promises";
import { join } from "path";
import { createServer } from "net";
import { createConnection } from "mysql2/promise";
import { createTestDatabaseManager } from "./utils/db";

/**
 * Asks the OS for a free TCP port by binding a temporary server to port 0. The OS atomically assigns
 * an available ephemeral port, eliminating the race condition present in probe-then-bind approaches.
 */
function findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();

        server.listen(0, "127.0.0.1", () => {
            const address = server.address();

            const port =
                typeof address === "object" && address ? address.port : 0;

            server.close(() => {
                resolve(port);
            });
        });

        server.on("error", reject);
    });
}

const STARTUP_RETRY_COUNT = 30;
const STARTUP_RETRY_DELAY_MS = 500;
const STARTUP_PROBE_TIMEOUT_MS = 2000;

function readBooleanEnv(name: string, fallback: boolean) {
    const value = process.env[name];

    if (value == null) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true";
}

const shouldUseWorkerDatabase = readBooleanEnv(
    "TEST_DB_PER_WORKER",
    !process.env.CI,
);

const shouldManageDatabaseLifecycle = readBooleanEnv(
    "TEST_DB_MANAGE_LIFECYCLE",
    shouldUseWorkerDatabase,
);

interface WorkerFixture {
    readonly workerSetup: {
        readonly backendPort: number;
        readonly frontendPort: number;
        readonly dbName: string;
        readonly dbManager: ReturnType<typeof createTestDatabaseManager>;
    };
}

// Required by Playwright.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, WorkerFixture>({
    workerSetup: [
        // Required by Playwright.
        // eslint-disable-next-line no-empty-pattern
        async ({}, use, workerInfo) => {
            // Setup separate database and server instances for each worker when worker DB mode is enabled.
            const workerId = workerInfo.workerIndex;
            const [backendPort, frontendPort] = await Promise.all([
                findFreePort(),
                findFreePort(),
            ]);
            const baseDbName = process.env.DB_NAME;

            if (!baseDbName) {
                throw new Error("DB_NAME must be set for e2e tests.");
            }

            const dbName = shouldUseWorkerDatabase
                ? `${baseDbName}_e2e_${workerId.toString()}`
                : baseDbName;

            if (shouldManageDatabaseLifecycle) {
                const setupConnection = await createConnection({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    port: parseInt(process.env.DB_PORT ?? "3306"),
                });

                await setupConnection.query(
                    `CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
                );

                await setupConnection.end();
            }

            execSync("pnpm push-db:test", {
                cwd: "../backend",
                env: { ...process.env, DB_NAME: dbName },
            });

            const dbManager = createTestDatabaseManager(dbName);
            await dbManager.cleanupAllTables();
            await dbManager.seedPrimaryTables();

            // `detached: true` (POSIX only) makes each process the leader of its own process group, so
            // killServers() can kill the whole group (shell + the pnpm/next/node descendants it spawns via
            // `shell: true`) instead of only the wrapper shell, which would otherwise orphan the real server.
            const backendProcess = spawn("pnpm start", {
                cwd: "../backend",
                env: {
                    ...process.env,
                    PORT: backendPort.toString(),
                    CORS_ORIGINS: `http://127.0.0.1:${frontendPort.toString()},http://localhost:${frontendPort.toString()}`,
                    DB_NAME: dbName,
                    IS_E2E_TEST: "true",
                    STORAGE_PATH: "./tests/storage",
                },
                shell: true,
                detached: process.platform !== "win32",
            });

            const frontendProcess = spawn("pnpm start", {
                cwd: ".",
                env: {
                    ...process.env,
                    PORT: frontendPort.toString(),
                    API_BASE_URL: `http://127.0.0.1:${backendPort.toString()}`,
                    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${backendPort.toString()}`,
                },
                shell: true,
                detached: process.platform !== "win32",
            });

            let processError: Error | null = null;

            const handleError = (error: Error) => {
                processError = error;
            };

            const checkExit = (code: number | null, name: string) => {
                if (code !== null && code !== 0) {
                    processError = new Error(
                        `${name} exited with code ${code.toString()}`,
                    );
                }
            };

            backendProcess.on("error", handleError);
            backendProcess.on("exit", (code) => {
                checkExit(code, "Backend server");
            });

            frontendProcess.on("error", handleError);
            frontendProcess.on("exit", (code) => {
                checkExit(code, "Frontend server");
            });

            backendProcess.stderr.on("data", (data: Buffer) => {
                console.error(
                    `[W${workerId.toString()} Backend] ${data.toString()}`,
                );
            });

            backendProcess.stdout.on("data", (data: Buffer) => {
                console.log(
                    `[W${workerId.toString()} Backend] ${data.toString()}`,
                );
            });

            frontendProcess.stderr.on("data", (data: Buffer) => {
                console.error(
                    `[W${workerId.toString()} Frontend] ${data.toString()}`,
                );
            });

            frontendProcess.stdout.on("data", (data: Buffer) => {
                console.log(
                    `[W${workerId.toString()} Frontend] ${data.toString()}`,
                );
            });

            // Wait for servers to be ready.
            let backendReady = false;
            let frontendReady = false;

            for (let i = 0; i < STARTUP_RETRY_COUNT; ++i) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (processError) {
                    // eslint-disable-next-line @typescript-eslint/only-throw-error
                    throw processError;
                }

                try {
                    if (!backendReady) {
                        const res = await fetch(
                            `http://127.0.0.1:${backendPort.toString()}`,
                            {
                                signal: AbortSignal.timeout(
                                    STARTUP_PROBE_TIMEOUT_MS,
                                ),
                            },
                        );

                        if (res.ok || res.status === 404) {
                            backendReady = true;
                        }
                    }

                    if (!frontendReady) {
                        const res = await fetch(
                            `http://127.0.0.1:${frontendPort.toString()}`,
                            {
                                signal: AbortSignal.timeout(
                                    STARTUP_PROBE_TIMEOUT_MS,
                                ),
                            },
                        );

                        if (res.ok || res.status === 404) {
                            frontendReady = true;
                        }
                    }

                    if (backendReady && frontendReady) {
                        break;
                    }
                } catch {
                    // Ignore transient probe failures while workers are starting.
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, STARTUP_RETRY_DELAY_MS),
                );
            }

            const killServers = () => {
                if (process.platform === "win32") {
                    try {
                        if (backendProcess.pid !== undefined) {
                            execSync(
                                `taskkill /pid ${backendProcess.pid.toString()} /T /F`,
                                { stdio: "ignore" },
                            );
                        }
                    } catch {
                        // Ignore
                    }

                    try {
                        if (frontendProcess.pid !== undefined) {
                            execSync(
                                `taskkill /pid ${frontendProcess.pid.toString()} /T /F`,
                                { stdio: "ignore" },
                            );
                        }
                    } catch {
                        // Ignore
                    }
                } else {
                    // Negative PID targets the whole process group (see the `detached` note above), which
                    // is required to reach the actual pnpm/next/node descendants, not just the wrapper shell.
                    try {
                        if (backendProcess.pid !== undefined) {
                            process.kill(-backendProcess.pid, "SIGKILL");
                        }
                    } catch {
                        // Already exited.
                    }

                    try {
                        if (frontendProcess.pid !== undefined) {
                            process.kill(-frontendProcess.pid, "SIGKILL");
                        }
                    } catch {
                        // Already exited.
                    }
                }
            };

            // Safety net: if this worker process crashes or is torn down abnormally (e.g. the browser
            // itself crashes mid-test, which Playwright recovers from by abandoning the worker and spawning
            // a replacement), the code below never reaches its normal teardown call to killServers(), which
            // would otherwise orphan the spawned backend/frontend servers indefinitely. `exit` still fires
            // for crashes that go through Node's normal shutdown (uncaught exceptions, SIGTERM); it does not
            // fire for an external SIGKILL, which cannot be intercepted by any process.
            process.on("exit", killServers);

            if (!backendReady || !frontendReady) {
                killServers();

                throw new Error(
                    `Servers failed to start. Backend: ${backendReady.toString()}, Frontend: ${frontendReady.toString()}`,
                );
            }

            await use({ backendPort, frontendPort, dbName, dbManager });

            // Teardown
            killServers();
            process.removeListener("exit", killServers);

            await rm(join("..", "backend", "tests", "storage", "attachments"), {
                recursive: true,
                force: true,
            });

            await new Promise<void>((resolve, reject) => {
                dbManager.db.$client.end((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve();
                });
            });

            if (shouldManageDatabaseLifecycle) {
                const teardownConnection = await createConnection({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    port: parseInt(process.env.DB_PORT ?? "3306"),
                });

                await teardownConnection.query(
                    `DROP DATABASE IF EXISTS \`${dbName}\``,
                );

                await teardownConnection.end();
            }
        },
        { scope: "worker", auto: true, timeout: 120000 },
    ],

    context: async ({ browser, contextOptions, workerSetup }, use) => {
        const context = await browser.newContext({
            ...contextOptions,
            baseURL: `http://127.0.0.1:${workerSetup.frontendPort.toString()}`,
        });

        await use(context);

        // Firefox can throw a protocol error about session-restore state when
        // closing a context after dialog interactions. The close still succeeds.
        await context.close().catch(() => {
            /* empty */
        });
    },

    request: async ({ playwright, contextOptions, workerSetup }, use) => {
        const requestContext = await playwright.request.newContext({
            ...contextOptions,
            baseURL: `http://127.0.0.1:${workerSetup.frontendPort.toString()}`,
        });

        await use(requestContext);
        await requestContext.dispose();
    },
});

export { expect } from "@playwright/test";
