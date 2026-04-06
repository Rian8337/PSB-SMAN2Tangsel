import { SessionController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { AcademicSession, AcademicSessionDTO } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockSessionService,
} from "@test/mocks";

describe("SessionController (unit)", () => {
    const controller = new SessionController(mockSessionService);

    const mockDateStart = new Date("2024-08-01T00:00:00Z");
    const mockDateEnd = new Date("2024-12-15T00:00:00Z");

    const mockAcademicSession: AcademicSession = {
        active: true,
        session: "2024/2025",
        semester: 1,
        startTime: mockDateStart,
        endTime: mockDateEnd,
    };

    const mockSessionDTO: AcademicSessionDTO = {
        active: true,
        session: "2024/2025",
        semester: 1,
        startTime: mockDateStart.getTime(),
        endTime: mockDateEnd.getTime(),
    };

    describe("getActive", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            AcademicSessionDTO | { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should return the active academic session", async () => {
            mockSessionService.getActive.mockResolvedValue(mockAcademicSession);

            await controller.getActive(req, res);

            expect(mockSessionService.getActive).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockSessionDTO);
        });
    });

    describe("getSession", () => {
        const createMockRequest = createMockRequestFactory<
            { session: string; semester: string },
            AcademicSessionDTO | { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should return the session for given session and semester", async () => {
            req.query = { session: "2024/2025", semester: "1" };

            mockSessionService.getSession.mockResolvedValue(
                mockAcademicSession,
            );

            await controller.getSession(req, res);

            expect(mockSessionService.getSession).toHaveBeenCalledWith(
                "2024/2025",
                1,
            );

            expect(res.json).toHaveBeenCalledWith(mockSessionDTO);
        });

        it.each([
            [undefined, "1"],
            ["2024/2025", undefined],
            [undefined, undefined],
        ])(
            "should return 400 if required query parameters are missing (session: %s, semester: %s)",
            async (session, semester) => {
                req.query = { session, semester };

                await controller.getSession(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(mockSessionService.getSession).not.toHaveBeenCalled();
            },
        );
    });

    describe("listSessions", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            AcademicSessionDTO[] | { error: string },
            unknown,
            Partial<{ query?: string; limit?: string; offset?: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should return a list of academic sessions", async () => {
            req.query = { query: "2024/2025", limit: "10", offset: "0" };

            mockSessionService.listSessions.mockResolvedValue([
                mockAcademicSession,
            ]);

            await controller.listSessions(req, res);

            expect(mockSessionService.listSessions).toHaveBeenCalledWith(
                "2024/2025",
                10,
                0,
            );

            expect(res.json).toHaveBeenCalledWith([mockSessionDTO]);
        });

        it("should handle missing query parameters gracefully", async () => {
            mockSessionService.listSessions.mockResolvedValue([
                mockAcademicSession,
            ]);

            await controller.listSessions(req, res);

            expect(mockSessionService.listSessions).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
            );

            expect(res.json).toHaveBeenCalledWith([mockSessionDTO]);
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

                await controller.listSessions(req, res);

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

                await controller.listSessions(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("createSession", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<AcademicSessionDTO>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should parse dates, create session, and return 201", async () => {
            req.body = mockSessionDTO;
            mockSessionService.createSession.mockResolvedValue(undefined);

            await controller.createSession(req, res);

            expect(mockSessionService.createSession).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it("should return 400 if body is malformed", async () => {
            req.body = { session: "2024/2025" };

            await controller.createSession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error: expect.any(String),
            });

            expect(mockSessionService.createSession).not.toHaveBeenCalled();
        });

        it("should return 400 if start or end time is not a valid number timestamp", async () => {
            req.body = {
                ...mockSessionDTO,
                startTime: "not-a-number" as unknown as number,
            };

            await controller.createSession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSessionService.createSession).not.toHaveBeenCalled();
        });
    });

    describe("updateSession", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<AcademicSessionDTO>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should parse dates, update session, and return 204", async () => {
            req.body = mockSessionDTO;
            mockSessionService.updateSession.mockResolvedValue(undefined);

            await controller.updateSession(req, res);

            expect(mockSessionService.updateSession).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 400 if body is malformed", async () => {
            req.body = { semester: 2 };

            await controller.updateSession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSessionService.updateSession).not.toHaveBeenCalled();
        });
    });

    describe("deleteSession", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<{ session: string; semester: number }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
        });

        it("should delete session and return 204", async () => {
            req.body = { session: "2024/2025", semester: 1 };
            mockSessionService.deleteSession.mockResolvedValue(undefined);

            await controller.deleteSession(req, res);

            expect(mockSessionService.deleteSession).toHaveBeenCalledWith(
                "2024/2025",
                1,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 400 if body is malformed", async () => {
            req.body = { session: "2024/2025" };

            await controller.deleteSession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSessionService.deleteSession).not.toHaveBeenCalled();
        });
    });
});
