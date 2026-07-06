import { users } from "@psb/shared/schema";
import {
    seededPrimaryData,
    testPassword,
    testPasswordHash,
} from "@psb/shared/tests";
import { UserListItem, UserRole } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    loginWithCredentials,
    seeders,
    testDbManager,
} from "@test/utils";
import { inArray } from "drizzle-orm";
import request from "supertest";

describe("UserController (integration)", () => {
    let testUserId: number;
    let testUserToDeleteId: number;

    const identifierSuffix = Date.now().toString().slice(-8);
    const testUserIdentifier = `10${identifierSuffix}`;
    const deleteUserIdentifier = `11${identifierSuffix}`;
    const createdUserIdentifier = `9${Date.now().toString()}`;
    const passwordTestIdentifier = `12${identifierSuffix}`;
    const updatedUserIdentifier = `15${identifierSuffix}`;

    beforeAll(async () => {
        // For testing GET and PATCH operations
        const baseUser = await seeders.users.seedOne({
            name: "Integration Test User",
            identifier: testUserIdentifier,
            password: testPasswordHash,
            role: UserRole.Student,
            active: true,
        });

        testUserId = baseUser.id!;

        // For testing the DELETE operation
        const userToDelete = await seeders.users.seedOne({
            name: "Delete Me User",
            identifier: deleteUserIdentifier,
            password: testPasswordHash,
            role: UserRole.Student,
            active: true,
        });

        testUserToDeleteId = userToDelete.id!;

        // For testing the password update operation
        await seeders.users.seedOne({
            name: "Password Update User",
            identifier: passwordTestIdentifier,
            password: testPasswordHash,
            role: UserRole.Student,
            active: true,
        });
    });

    afterAll(async () => {
        await testDbManager.db
            .delete(users)
            .where(
                inArray(users.identifier, [
                    testUserIdentifier,
                    deleteUserIdentifier,
                    createdUserIdentifier,
                    passwordTestIdentifier,
                    updatedUserIdentifier,
                ]),
            );

        await testDbManager.cleanupSecondaryTables();
    });

    describe("GET /users/list", () => {
        const endpoint = "/users/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return a list of users", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as UserListItem[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThanOrEqual(2);
            });

            it("should correctly apply search queries", async () => {
                const res = await agent.get(
                    `${endpoint}?query=Integration Test`,
                );

                const body = res.body as UserListItem[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThan(0);
                expect(body[0].identifier).toBe(testUserIdentifier);
            });

            it("should return 400 for invalid limits", async () => {
                const res = await agent.get(`${endpoint}?limit=-5`);

                expect(res.status).toBe(400);
            });
        });
    });

    describe("GET /users/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/users/${testUserId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return detailed user information", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as UserListItem;

                expect(res.status).toBe(200);
                expect(body.id).toBe(testUserId);
                expect(body.name).toBe("Integration Test User");
                expect(body.role).toBe(UserRole.Student);
            });

            it("should return 400 for invalid ID parameter", async () => {
                const res = await agent.get("/users/invalid-id");

                expect(res.status).toBe(400);
            });
        });
    });

    describe("POST /users/create", () => {
        const endpoint = "/users/create";

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should successfully create a new user", async () => {
                const res = await agent.post(endpoint).send({
                    name: "Brand New User",
                    identifier: createdUserIdentifier,
                    password: "StrongPassword123!",
                    role: UserRole.Teacher,
                });

                expect(res.status).toBe(201);

                // Verify insertion
                const listRes = await agent.get(
                    `/users/list?query=${createdUserIdentifier}`,
                );

                const listBody = listRes.body as UserListItem[];

                expect(listBody.length).toBeGreaterThan(0);
                expect(listBody[0].name).toBe("Brand New User");
                expect(listBody[0].role).toBe(UserRole.Teacher);
            });

            it("should return 400 for missing fields", async () => {
                const res = await agent.post(endpoint).send({
                    name: "Incomplete User",
                    // Missing password, role, identifier
                });

                expect(res.status).toBe(400);
            });
        });
    });

    describe("PATCH /users/:id", () => {
        let endpoint: string;

        const payload = {
            name: "Updated Integration User",
            identifier: testUserIdentifier,
            active: false,
        };

        beforeAll(() => {
            endpoint = `/users/${testUserId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).patch(endpoint).send(payload);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 400 for a missing or empty identifier", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .patch(endpoint)
                .send({ ...payload, identifier: "" });

            expect(res.status).toBe(400);
        });

        it("should return 409 when the identifier is already used by another user", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .patch(endpoint)
                .send({ ...payload, identifier: passwordTestIdentifier });

            expect(res.status).toBe(409);
        });

        it("should update user name, identifier, and active status if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .patch(endpoint)
                .send({ ...payload, identifier: updatedUserIdentifier });

            expect(res.status).toBe(200);

            // Verify the update
            const getRes = await agent.get(endpoint);
            const getBody = getRes.body as UserListItem;

            expect(getBody.name).toBe(payload.name);
            expect(getBody.identifier).toBe(updatedUserIdentifier);
            expect(getBody.active).toBe(payload.active);
        });
    });

    describe("PATCH /users/update-password", () => {
        const endpoint = "/users/update-password";
        const newPassword = "NewStrongPassword456!";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).patch(endpoint).send({
                currentPassword: testPassword,
                newPassword: newPassword,
            });

            expect(res.status).toBe(401);
        });

        describe("Authenticated User", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginWithCredentials(agent, passwordTestIdentifier);
            });

            it("should return 400 if payload is malformed", async () => {
                // Missing newPassword
                const res = await agent
                    .patch(endpoint)
                    .send({ currentPassword: testPassword });

                expect(res.status).toBe(400);
            });

            it("should successfully update the password", async () => {
                const res = await agent.patch(endpoint).send({
                    currentPassword: testPassword,
                    newPassword: newPassword,
                });

                expect(res.status).toBe(200);

                // Verify the password was actually updated by attempting a new login
                const verificationAgent = request.agent(app);

                const loginRes = await loginWithCredentials(
                    verificationAgent,
                    passwordTestIdentifier,
                    newPassword,
                );

                expect(loginRes.status).toBe(200);
            });
        });
    });

    describe("DELETE /users/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/users/${testUserToDeleteId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).delete(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        it("should delete the user if requested by an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(204);

            // Verify it's gone from the list
            const listRes = await agent.get(
                `/users/list?query=${deleteUserIdentifier}`,
            );

            const listBody = listRes.body as UserListItem[];
            expect(listBody.length).toBe(0);
        });

        describe("preventing deletion of students with related data", () => {
            const relatedDataIdentifier = `14${identifierSuffix}`;
            let studentWithDataId: number;

            beforeAll(async () => {
                const session = seededPrimaryData.sessions[0];
                const subject = seededPrimaryData.subjects[0];
                const teacher = seededPrimaryData.teachers[0];

                const student = await seeders.users.seedOne({
                    name: "Student With Submission",
                    identifier: relatedDataIdentifier,
                    password: testPasswordHash,
                    role: UserRole.Student,
                    active: true,
                });

                studentWithDataId = student.id!;

                await seeders.students.seedOne({ userId: studentWithDataId });

                const cls = await seeders.classes.seedOne({
                    name: "UC-Delete-Guard",
                    session: session.session,
                    semester: session.semester,
                });

                const classSubject = await seeders.classSubjects.seedOne({
                    classId: cls.id!,
                    subjectId: subject.id,
                    teacherId: teacher.userId,
                });

                const assignment = await seeders.assignments.seedOne({
                    classSubjectId: classSubject.id!,
                    title: "Delete Guard Assignment",
                    visible: true,
                });

                await seeders.assignmentSubmissions.seedOne({
                    assignmentId: assignment.id!,
                    studentId: studentWithDataId,
                });
            });

            afterAll(async () => {
                await seeders.users.deleteWhere({
                    identifier: relatedDataIdentifier,
                });
            });

            it("should return 409 when an administrator tries to delete a student with assignment submissions", async () => {
                const agent = request.agent(app);
                await loginAdministrator(agent);

                const res = await agent.delete(
                    `/users/${studentWithDataId.toString()}`,
                );

                expect(res.status).toBe(409);
            });
        });
    });

    describe("Administrator management safeguards", () => {
        const seededAdminId = seededPrimaryData.users.find(
            (u) => u.role === UserRole.Administrator,
        )!.id;

        describe("protecting the last active administrator", () => {
            it("should return 400 when the sole active administrator tries to delete themselves", async () => {
                const agent = request.agent(app);
                await loginAdministrator(agent);

                const res = await agent.delete(
                    `/users/${seededAdminId.toString()}`,
                );

                expect(res.status).toBe(400);
            });

            it("should return 400 when the sole active administrator tries to deactivate themselves via PATCH", async () => {
                const agent = request.agent(app);
                await loginAdministrator(agent);

                const res = await agent
                    .patch(`/users/${seededAdminId.toString()}`)
                    .send({ name: "Administrator", active: false });

                expect(res.status).toBe(400);
            });
        });

        describe("protecting an administrator's own account", () => {
            const tempAdminIdentifier = `13${identifierSuffix}`;
            let tempAdminId: number;

            beforeAll(async () => {
                const admin = await seeders.users.seedOne({
                    name: "Temporary Administrator",
                    identifier: tempAdminIdentifier,
                    password: testPasswordHash,
                    role: UserRole.Administrator,
                    active: true,
                });

                tempAdminId = admin.id!;
            });

            afterAll(async () => {
                await seeders.users.deleteWhere({
                    identifier: tempAdminIdentifier,
                });
            });

            it("should return 400 when an administrator tries to delete their own account, even if other admins exist", async () => {
                const agent = request.agent(app);
                await loginWithCredentials(agent, tempAdminIdentifier);

                const res = await agent.delete(
                    `/users/${tempAdminId.toString()}`,
                );

                expect(res.status).toBe(400);
            });

            it("should return 400 when an administrator tries to deactivate their own account via PATCH, even if other admins exist", async () => {
                const agent = request.agent(app);
                await loginWithCredentials(agent, tempAdminIdentifier);

                const res = await agent
                    .patch(`/users/${tempAdminId.toString()}`)
                    .send({ name: "Temporary Administrator", active: false });

                expect(res.status).toBe(400);
            });

            it("should allow an administrator to delete a different, non-last active administrator", async () => {
                const agent = request.agent(app);
                await loginAdministrator(agent);

                const res = await agent.delete(
                    `/users/${tempAdminId.toString()}`,
                );

                expect(res.status).toBe(204);
            });
        });
    });
});
