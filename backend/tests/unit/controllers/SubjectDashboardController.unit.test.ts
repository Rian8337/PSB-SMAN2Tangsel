import { SubjectDashboardController } from "@/controllers/SubjectDashboardController";
import { SubjectDashboard, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassSubjectService,
} from "@test/mocks";

describe("SubjectDashboardController (unit)", () => {
    const controller = new SubjectDashboardController(mockClassSubjectService);
    let res: ReturnType<typeof createMockResponse>;

    const mockDashboard: SubjectDashboard = {
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1", session: "2023/2024", semester: 1 },
        materials: [],
        assignments: [],
    };

    const createMockRequest = createMockRequestFactory<
        { id: string },
        SubjectDashboard
    >();

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getDashboard", () => {
        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { id: "1" } });

            await controller.getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(
                mockClassSubjectService.getStudentDashboard,
            ).not.toHaveBeenCalled();
            expect(
                mockClassSubjectService.getTeacherDashboard,
            ).not.toHaveBeenCalled();
        });

        it("should call getStudentDashboard and return the dashboard for a student session", async () => {
            mockClassSubjectService.getStudentDashboard.mockResolvedValue(
                mockDashboard,
            );

            const req = createMockRequest({
                params: { id: "5" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.Student,
                },
            });

            await controller.getDashboard(req, res);

            expect(
                mockClassSubjectService.getStudentDashboard,
            ).toHaveBeenCalledWith(5, 3);
            expect(res.json).toHaveBeenCalledWith(mockDashboard);
        });

        it("should call getTeacherDashboard and return the dashboard for a teacher session", async () => {
            mockClassSubjectService.getTeacherDashboard.mockResolvedValue(
                mockDashboard,
            );

            const req = createMockRequest({
                params: { id: "7" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.getDashboard(req, res);

            expect(
                mockClassSubjectService.getTeacherDashboard,
            ).toHaveBeenCalledWith(7, 2);
            expect(res.json).toHaveBeenCalledWith(mockDashboard);
        });

        it("should return 403 for an administrator session", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 1,
                    identifier: "1",
                    role: UserRole.Administrator,
                },
            });

            await controller.getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(
                mockClassSubjectService.getStudentDashboard,
            ).not.toHaveBeenCalled();
            expect(
                mockClassSubjectService.getTeacherDashboard,
            ).not.toHaveBeenCalled();
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid ID: $id",
            async ({ id }) => {
                const req = createMockRequest({
                    params: { id },
                    sessionData: {
                        userId: 3,
                        identifier: "0012345678",
                        role: UserRole.Student,
                    },
                });

                await controller.getDashboard(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockClassSubjectService.getStudentDashboard,
                ).not.toHaveBeenCalled();
            },
        );
    });
});
