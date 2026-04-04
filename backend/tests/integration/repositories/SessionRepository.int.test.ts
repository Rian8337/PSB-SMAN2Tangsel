import { SessionRepository } from "@/repositories";
import { sessions } from "@psb/shared/schema";
import { AcademicSession, ValidSession } from "@psb/shared/types";
import { seeders, testDb } from "@test/utils";
import { and, eq, or } from "drizzle-orm";

describe("SessionRepository (integration)", () => {
    const repository = new SessionRepository(testDb);

    const testSession: AcademicSession = {
        active: null,
        session: "2099/2100",
        semester: 1,
        startTime: new Date("2099-01-01T00:00:00Z"),
        endTime: new Date("2099-06-01T00:00:00Z"),
    };

    beforeAll(async () => {
        await seeders.sessions.seedOne(testSession);
    });

    afterAll(async () => {
        await testDb
            .delete(sessions)
            .where(
                or(
                    eq(sessions.session, testSession.session),
                    eq(sessions.session, "2098/2099"),
                ),
            );
    });

    describe("getActive", () => {
        it("should return the seeded active session", async () => {
            const activeSession = await repository.getActive();

            expect(activeSession).not.toBeNull();
            expect(activeSession?.active).toBe(true);
        });
    });

    describe("get", () => {
        it("should return a session by session and semester", async () => {
            const session = await repository.get(
                testSession.session,
                testSession.semester,
            );

            expect(session).not.toBeNull();
            expect(session?.session).toBe(testSession.session);
            expect(session?.semester).toBe(testSession.semester);
        });

        it("should return null for a non-existent session", async () => {
            const session = await repository.get("2199/2200", 1);

            expect(session).toBeNull();
        });
    });

    describe("list", () => {
        it("shoud list sessions with limit and offset", async () => {
            const result = await repository.list(undefined, 1, 0);

            expect(result).toHaveLength(1);
        });

        it("should filter sessions by query", async () => {
            const result = await repository.list(testSession.session);

            expect(result.every((s) => s.session === testSession.session)).toBe(
                true,
            );
        });
    });

    describe("create & active swap", () => {
        const newSession: ValidSession = "2098/2099";

        it("should create a new session and deactivate the old active session", async () => {
            const initialActive = await repository.getActive();
            expect(initialActive).not.toBeNull();

            await repository.create(
                newSession,
                1,
                new Date("2098-01-01T00:00:00Z"),
                new Date("2098-06-01T00:00:00Z"),
                true,
            );

            const newlyActive = await repository.getActive();
            expect(newlyActive?.session).toBe(newSession);
            expect(newlyActive?.semester).toBe(1);

            // Revert active session back to original.
            await testDb.transaction(async (tx) => {
                await tx
                    .update(sessions)
                    .set({ active: null })
                    .where(
                        and(
                            eq(sessions.session, newSession),
                            eq(sessions.semester, 1),
                        ),
                    );

                await tx
                    .update(sessions)
                    .set({ active: true })
                    .where(
                        and(
                            eq(sessions.session, initialActive!.session),
                            eq(sessions.semester, initialActive!.semester),
                        ),
                    );
            });
        });
    });

    describe("update", () => {
        it("should update an existing session", async () => {
            const newStartTime = new Date("2099-02-01T00:00:00Z");

            await repository.update(
                testSession.session,
                testSession.semester,
                newStartTime,
                testSession.endTime,
                testSession.active ?? false,
            );

            const updatedSession = await repository.get(
                testSession.session,
                testSession.semester,
            );

            expect(updatedSession?.startTime.getTime()).toBe(
                newStartTime.getTime(),
            );
        });
    });

    describe("delete", () => {
        it("should delete an existing session", async () => {
            await repository.delete(testSession.session, testSession.semester);

            const deletedSession = await repository.get(
                testSession.session,
                testSession.semester,
            );

            expect(deletedSession).toBeNull();
        });
    });
});
