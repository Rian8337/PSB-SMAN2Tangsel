import { subjects } from "@psb/shared/schema";
import { Subject } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    seeders,
    testDbManager,
} from "@test/utils";
import { inArray } from "drizzle-orm";
import request from "supertest";

describe("SubjectController (integration)", () => {
    let testSubjectId: number;
    let testSubjectToDeleteId: number;

    beforeAll(async () => {
        // Base subject for testing GET and PUT operations
        const baseSubject = await seeders.subjects.seedOne({
            code: "INT-PHYS",
            name: "Integration Physics",
            active: true,
        });

        testSubjectId = baseSubject.id!;

        // Subject specifically for testing the DELETE operation
        const subjectToDelete = await seeders.subjects.seedOne({
            code: "INT-MATH",
            name: "Integration Math",
            active: true,
        });

        testSubjectToDeleteId = subjectToDelete.id!;
    });

    afterAll(async () => {
        await testDbManager.db
            .delete(subjects)
            .where(
                inArray(subjects.id, [testSubjectId, testSubjectToDeleteId]),
            );
    });

    describe("GET /subjects/list", () => {
        const endpoint = "/subjects/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should allow students to view the list of subjects", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as Subject[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThanOrEqual(2);
            });

            it("should correctly apply search queries", async () => {
                const res = await agent.get(
                    `${endpoint}?query=Integration Physics`,
                );

                const body = res.body as Subject[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThan(0);
                expect(body[0].code).toBe("INT-PHYS");
            });
        });
    });

    describe("GET /subjects/:id", () => {
        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should return a specific subject by ID", async () => {
                const res = await agent.get(
                    `/subjects/${testSubjectId.toString()}`,
                );

                const body = res.body as Subject;

                expect(res.status).toBe(200);
                expect(body.id).toBe(testSubjectId);
                expect(body.code).toBe("INT-PHYS");
            });

            it("should return 400 for an invalid ID format", async () => {
                const res = await agent.get("/subjects/abc");
                expect(res.status).toBe(400);
            });
        });
    });

    describe("POST /subjects", () => {
        const endpoint = "/subjects";

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should restrict creation for students", async () => {
                const res = await agent.post(endpoint).send({
                    code: "STU-FAIL",
                    name: "Student Attempt",
                });

                expect(res.status).toBe(403);
            });
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should successfully create a new subject", async () => {
                const res = await agent.post(endpoint).send({
                    code: "NEW-CHEM",
                    name: "New Chemistry",
                });

                expect(res.status).toBe(201);

                // Verify insertion
                const listRes = await agent.get(
                    `${endpoint}/list?query=NEW-CHEM`,
                );

                const listBody = listRes.body as Subject[];
                expect(listBody.length).toBeGreaterThan(0);
                expect(listBody[0].name).toBe("New Chemistry");
                expect(listBody[0].active).toBe(true);
            });

            it("should return 400 if validation fails", async () => {
                const res = await agent
                    .post(endpoint)
                    .send({ name: "Missing Code" });

                expect(res.status).toBe(400);
            });
        });
    });

    describe("PUT /subjects/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should update an existing subject", async () => {
                const res = await agent
                    .put(`/subjects/${testSubjectId.toString()}`)
                    .send({
                        code: "UPD-PHYS",
                        name: "Updated Physics",
                        active: false,
                    });

                expect(res.status).toBe(200);

                // Verify the update
                const getRes = await agent.get(
                    `/subjects/${testSubjectId.toString()}`,
                );

                const getBody = getRes.body as Subject;

                expect(getBody.code).toBe("UPD-PHYS");
                expect(getBody.name).toBe("Updated Physics");
                expect(getBody.active).toBe(false);
            });
        });
    });

    describe("DELETE /subjects/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should delete the subject", async () => {
                const res = await agent.delete(
                    `/subjects/${testSubjectToDeleteId.toString()}`,
                );

                expect(res.status).toBe(204);

                // Verify it's gone
                const getRes = await agent.get(
                    `/subjects/${testSubjectToDeleteId.toString()}`,
                );

                expect(getRes.status).toBe(404);
            });
        });
    });
});
