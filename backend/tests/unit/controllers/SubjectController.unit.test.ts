import { SubjectController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { ClassSubjectAssignment, Subject, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassSubjectService,
    mockSessionService,
    mockSubjectService,
} from "@test/mocks";

describe("SubjectController (unit)", () => {
    const controller = new SubjectController(
        mockSubjectService,
        mockClassSubjectService,
        mockSessionService,
    );

    const mockSubject: Subject = {
        id: 1,
        active: true,
        code: "MA101",
        name: "Matematika",
    };

    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getMySubjects", () => {
        const mockSubjects: ClassSubjectAssignment[] = [
            {
                id: 1,
                class: { id: 10, name: "X IPA 1" },
                subject: { id: 1, code: "MA101", name: "Matematika" },
                teacher: { id: 2, name: "Bu Siti" },
            },
        ];

        const createMockRequest = createMockRequestFactory<
            unknown,
            ClassSubjectAssignment[],
            unknown,
            Partial<{
                query: string;
                limit: string;
                offset: string;
                session: string;
                semester: string;
            }>
        >();

        describe("as a student", () => {
            let req: ReturnType<typeof createMockRequest>;

            beforeEach(() => {
                req = createMockRequest({
                    sessionData: {
                        userId: 1,
                        identifier: "1",
                        role: UserRole.Student,
                        classId: 10,
                    },
                });
            });

            it("should return subjects using classId from session data", async () => {
                mockClassSubjectService.listAssignedSubjects.mockResolvedValueOnce(
                    mockSubjects,
                );

                await controller.getMySubjects(req, res);

                expect(
                    mockClassSubjectService.listAssignedSubjects,
                ).toHaveBeenCalledWith(10, undefined, undefined, undefined);

                expect(res.json).toHaveBeenCalledWith(mockSubjects);
            });

            it("should resolve classId from session when session and semester are provided", async () => {
                req.query = { session: "2023/2024", semester: "2" };

                mockClassSubjectService.getStudentClassIdForSession.mockResolvedValueOnce(
                    77,
                );

                mockClassSubjectService.listAssignedSubjects.mockResolvedValueOnce(
                    mockSubjects,
                );

                await controller.getMySubjects(req, res);

                expect(
                    mockClassSubjectService.getStudentClassIdForSession,
                ).toHaveBeenCalledWith(1, "2023/2024", 2);

                expect(
                    mockClassSubjectService.listAssignedSubjects,
                ).toHaveBeenCalledWith(77, undefined, undefined, undefined);

                expect(res.json).toHaveBeenCalledWith(mockSubjects);
            });

            it("should return empty list when student is not enrolled in the given session", async () => {
                req.query = { session: "2020/2021", semester: "1" };

                mockClassSubjectService.getStudentClassIdForSession.mockResolvedValueOnce(
                    null,
                );

                await controller.getMySubjects(req, res);

                expect(
                    mockClassSubjectService.listAssignedSubjects,
                ).not.toHaveBeenCalled();

                expect(res.json).toHaveBeenCalledWith([]);
            });
        });

        describe("as a teacher", () => {
            let req: ReturnType<typeof createMockRequest>;

            beforeEach(() => {
                req = createMockRequest({
                    sessionData: {
                        userId: 2,
                        identifier: "2",
                        role: UserRole.Teacher,
                    },
                });
            });

            it("should fall back to active session when no session params provided", async () => {
                mockSessionService.getActive.mockResolvedValueOnce({
                    active: true,
                    session: "2024/2025",
                    semester: 2,
                    startTime: new Date(),
                    endTime: new Date(),
                });

                mockClassSubjectService.listAssignedSubjectsForTeacher.mockResolvedValueOnce(
                    mockSubjects,
                );

                await controller.getMySubjects(req, res);

                expect(mockSessionService.getActive).toHaveBeenCalled();

                expect(
                    mockClassSubjectService.listAssignedSubjectsForTeacher,
                ).toHaveBeenCalledWith(
                    2,
                    "2024/2025",
                    2,
                    undefined,
                    undefined,
                    undefined,
                );

                expect(res.json).toHaveBeenCalledWith(mockSubjects);
            });

            it("should use provided session and semester without calling getActive", async () => {
                req.query = { session: "2023/2024", semester: "1" };

                mockClassSubjectService.listAssignedSubjectsForTeacher.mockResolvedValueOnce(
                    mockSubjects,
                );

                await controller.getMySubjects(req, res);

                expect(mockSessionService.getActive).not.toHaveBeenCalled();

                expect(
                    mockClassSubjectService.listAssignedSubjectsForTeacher,
                ).toHaveBeenCalledWith(
                    2,
                    "2023/2024",
                    1,
                    undefined,
                    undefined,
                    undefined,
                );

                expect(res.json).toHaveBeenCalledWith(mockSubjects);
            });
        });

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidLimitFormat"],
            ["0", "controller.invalidLimitRange"],
            ["-5", "controller.invalidLimitRange"],
            ["51", "controller.invalidLimitRange"],
        ])(
            "should return 400 for invalid limit: %s",
            async (limit, errorKey) => {
                const req = createMockRequest({
                    sessionData: {
                        userId: 1,
                        identifier: "1",
                        role: UserRole.Student,
                        classId: 10,
                    },
                });

                req.query.limit = limit;

                await controller.getMySubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidOffsetFormat"],
            ["-1", "controller.invalidOffsetRange"],
        ])(
            "should return 400 for invalid offset: %s",
            async (offset, errorKey) => {
                const req = createMockRequest({
                    sessionData: {
                        userId: 1,
                        identifier: "1",
                        role: UserRole.Student,
                        classId: 10,
                    },
                });

                req.query.offset = offset;

                await controller.getMySubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );

        it.each<[string, string, MessageKey]>([
            [
                "invalid-format",
                "1",
                "Session must be in the format YYYY/YYYY" as MessageKey,
            ],
            [
                "2024/2025",
                "3",
                "Invalid enum value. Expected 1 | 2" as MessageKey,
            ],
        ])(
            "should return 400 for invalid session params: session=%s semester=%s",
            async (session, semester) => {
                const req = createMockRequest({
                    sessionData: {
                        userId: 1,
                        identifier: "1",
                        role: UserRole.Student,
                        classId: 10,
                    },
                });

                req.query = { session, semester };

                await controller.getMySubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );
    });

    describe("getSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Subject
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should return subject details for valid ID", async () => {
            mockSubjectService.findById.mockResolvedValueOnce(mockSubject);

            await controller.getSubject(req, res);

            expect(mockSubjectService.findById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockSubject);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.getSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.findById).not.toHaveBeenCalled();
        });
    });

    describe("listSubjects", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            Subject[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should decode query and pass pagination parameters", async () => {
            req.query = {
                query: "matematika%20lanjutan",
                limit: "10",
                offset: "5",
            };

            mockSubjectService.listSubjects.mockResolvedValueOnce([
                mockSubject,
            ]);

            await controller.listSubjects(req, res);

            expect(mockSubjectService.listSubjects).toHaveBeenCalledWith(
                "matematika lanjutan",
                10,
                5,
            );

            expect(res.json).toHaveBeenCalledWith([mockSubject]);
        });

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidLimitFormat"],
            ["0", "controller.invalidLimitRange"],
            ["-5", "controller.invalidLimitRange"],
            ["51", "controller.invalidLimitRange"],
        ])(
            "should return 400 for invalid limit: %s",
            async (limit, errorKey) => {
                req.query.limit = limit;

                await controller.listSubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidOffsetFormat"],
            ["-1", "controller.invalidOffsetRange"],
        ])(
            "should return 400 for invalid offset: %s",
            async (offset, errorKey) => {
                req.query.offset = offset;

                await controller.listSubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("createSubject", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            never,
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should create subject with valid data", async () => {
            req.body = { code: "MA101", name: "Matematika" };

            await controller.createSubject(req, res);

            expect(mockSubjectService.createSubject).toHaveBeenCalledWith(
                "MA101",
                "Matematika",
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it("should return 400 if Zod validation fails", async () => {
            req.body = { code: "fis-xi", name: "Fisika" };

            await controller.createSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.createSubject).not.toHaveBeenCalled();
        });
    });

    describe("updateSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never,
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should default active to true if not provided", async () => {
            req.body = { code: "MA101", name: "Matematika" };

            await controller.updateSubject(req, res);

            expect(mockSubjectService.updateSubject).toHaveBeenCalledWith(
                1,
                "MA101",
                "Matematika",
                true,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.updateSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.updateSubject).not.toHaveBeenCalled();
        });
    });

    describe("deleteSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should delete subject with valid ID", async () => {
            await controller.deleteSubject(req, res);

            expect(mockSubjectService.deleteSubject).toHaveBeenCalledWith(1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.deleteSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.deleteSubject).not.toHaveBeenCalled();
        });
    });
});
