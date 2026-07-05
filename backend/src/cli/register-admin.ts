import { createDatabase } from "@psb/shared/database";
import { administrators, users } from "@psb/shared/schema";
import { DrizzleDb, UserRole } from "@psb/shared/types";
import { passwordRegex } from "@psb/shared/validator";
import { hash } from "bcrypt";
import { createInterface, Interface } from "readline";
import { loadEnvironmentVariables } from "@/env";
import { EnvironmentVariableKey } from "@/types";

/**
 * Validates the provided name to ensure it meets the required criteria.
 *
 * @param name The name to validate.
 * @returns Whether the name is valid.
 */
export function validateName(name: string): boolean {
    const trimmed = name.trim();
    return (
        trimmed.length > 0 &&
        trimmed.length <= 100 &&
        /^[a-zA-Z\s]+$/.test(trimmed)
    );
}

/**
 * Validates the provided identifier to ensure it meets the required criteria.
 *
 * @param identifier The identifier to validate.
 * @returns Whether the identifier is valid.
 */
export function validateIdentifier(identifier: string): boolean {
    return /^[1-9]\d*$/.test(identifier.trim());
}

/**
 * Validates the provided password to ensure it meets the required criteria.
 *
 * @param password The password to validate.
 * @returns Whether the password is valid.
 */
export function validatePassword(password: string): boolean {
    return passwordRegex.test(password);
}

/**
 * Creates a new administrator account in the database.
 *
 * @param db The database connection.
 * @param name The full name of the administrator.
 * @param identifier The staff ID of the administrator.
 * @param password The password for the administrator account.
 */
export async function createAdminAccount(
    db: DrizzleDb,
    name: string,
    identifier: string,
    password: string,
) {
    const passwordHash = await hash(password, 12);

    await db.transaction(async (tx) => {
        const [result] = await tx.insert(users).values({
            name: name.trim(),
            password: passwordHash,
            role: UserRole.Administrator,
            identifier: identifier.trim(),
            active: true,
        });

        await tx.insert(administrators).values({ userId: result.insertId });
    });
}

/**
 * Prompts the user with a question and returns their input.
 *
 * @param rl The readline interface to use for prompting.
 * @param prompt The question to ask the user.
 * @returns The user's input.
 */
function question(rl: Interface, prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

/**
 * Prompts the user to enter a password and returns their input.
 *
 * @param prompt The question to ask the user.
 * @returns The user's input.
 */
function questionPassword(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write(prompt);

        const chars: string[] = [];

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");

        const onData = (char: string) => {
            switch (char) {
                case "\n":
                case "\r":
                case "\u0004": // Ctrl+D (EOF)
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener("data", onData);
                    process.stdout.write("\n");
                    resolve(chars.join(""));
                    break;

                case "\u0003": // Ctrl+C (SIGINT)
                    process.stdout.write("\n");
                    process.exit(1);

                // eslint-disable-next-line no-fallthrough
                case "\u007f": // Backspace (DEL)
                case "\b": // Backspace (BS)
                    chars.pop();
                    break;

                default:
                    chars.push(char);
            }
        };

        process.stdin.on("data", onData);
    });
}

async function main() {
    loadEnvironmentVariables();

    if (!process.stdin.isTTY) {
        console.error(
            "Error: This script must be run in an interactive terminal.",
        );

        process.exit(1);
    }

    const db = createDatabase({
        host: process.env[EnvironmentVariableKey.DatabaseHost],
        user: process.env[EnvironmentVariableKey.DatabaseUser],
        password: process.env[EnvironmentVariableKey.DatabasePassword],
        database: process.env[EnvironmentVariableKey.DatabaseName],
        port: parseInt(
            process.env[EnvironmentVariableKey.DatabasePort] ?? "3306",
        ),
        timezone: "+00:00",
    });

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let name: string;
    let identifier: string;

    try {
        name = await question(rl, "Full name: ");
        identifier = await question(rl, "Staff ID: ");
    } finally {
        rl.close();
    }

    if (!validateName(name)) {
        console.error(
            "Error: Invalid name. Name must only contain letters and spaces (max 100 characters).",
        );

        db.$client.end();
        process.exit(1);
    }

    if (!validateIdentifier(identifier)) {
        console.error(
            "Error: Invalid staff ID. Staff ID must be a positive integer.",
        );

        db.$client.end();
        process.exit(1);
    }

    const password = await questionPassword("Password: ");
    const confirmPassword = await questionPassword("Confirm password: ");

    if (!validatePassword(password)) {
        console.error(
            "Error: Invalid password. Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).",
        );

        db.$client.end();
        process.exit(1);
    }

    if (password !== confirmPassword) {
        console.error("Error: Passwords do not match.");
        db.$client.end();
        process.exit(1);
    }

    try {
        await createAdminAccount(db, name, identifier, password);
        console.log("Admin account registered successfully.");
    } catch (err) {
        const cause = err instanceof Error ? err.cause : undefined;

        const isDupEntry =
            (err instanceof Error && err.message.includes("ER_DUP_ENTRY")) ||
            (cause instanceof Error && cause.message.includes("ER_DUP_ENTRY"));

        if (isDupEntry) {
            console.error(
                `Error: Staff ID "${identifier}" is already in use. Please choose a different one.`,
            );

            process.exit(1);
        }

        throw err;
    } finally {
        db.$client.end();
    }
}

if (require.main === module) {
    main().catch((err: unknown) => {
        if (err instanceof Error) {
            console.error("Error:", err.message);

            if (err.cause instanceof Error) {
                console.error("Cause:", err.cause.message);
            }
        } else {
            console.error("Error:", String(err));
        }

        process.exit(1);
    });
}
