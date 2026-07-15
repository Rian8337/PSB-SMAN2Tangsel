import { AnalyticsController } from "@/controllers";
import { DownloadAnalytics, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockAnalyticsService,
} from "@test/mocks";

describe("AnalyticsController (unit)", () => {
    const controller = new AnalyticsController(mockAnalyticsService);

    let res: ReturnType<typeof createMockResponse<DownloadAnalytics>>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getDownloadAnalytics", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            DownloadAnalytics,
            unknown,
            Partial<{ session: string; semester: string; limit: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    role: UserRole.Teacher,
                    identifier: "1",
                    userId: 42,
                },
                query: { session: "2024/2025", semester: "1" },
            });
        });

        it("should call the service with the correct args and default limit to 5 when omitted", async () => {
            const analytics: DownloadAnalytics = {
                timeSeries: [{ weekStart: "2024-03-04", count: 2 }],
                topAttachments: [
                    {
                        attachmentId: 1,
                        name: "Material Attachment",
                        downloadCount: 4,
                        type: "material",
                        contentId: 1,
                        contentTitle: "Material One",
                        classSubjectId: 1,
                        subject: { id: 1, code: "MA1", name: "Matematika" },
                        class: { id: 1, name: "XI-IPA-1" },
                    },
                ],
            };

            mockAnalyticsService.getDownloadAnalytics.mockResolvedValueOnce(
                analytics,
            );

            await controller.getDownloadAnalytics(req, res);

            expect(
                mockAnalyticsService.getDownloadAnalytics,
            ).toHaveBeenCalledWith(42, "2024/2025", 1, 5);

            expect(res.json).toHaveBeenCalledWith(analytics);
        });

        it("should pass the provided limit to the service instead of the default", async () => {
            mockAnalyticsService.getDownloadAnalytics.mockResolvedValueOnce({
                timeSeries: [],
                topAttachments: [],
            });

            req.query = { session: "2024/2025", semester: "1", limit: "10" };

            await controller.getDownloadAnalytics(req, res);

            expect(
                mockAnalyticsService.getDownloadAnalytics,
            ).toHaveBeenCalledWith(42, "2024/2025", 1, 10);
        });

        it.each<[string | undefined, string | undefined]>([
            [undefined, "1"],
            ["2024/2025", undefined],
            ["invalid-session", "1"],
            ["2024/2025", "3"],
            ["2024/2025", "abc"],
        ])(
            "should return 400 for invalid query: session=%s semester=%s",
            async (session, semester) => {
                req.query = { session, semester };

                await controller.getDownloadAnalytics(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockAnalyticsService.getDownloadAnalytics,
                ).not.toHaveBeenCalled();
            },
        );
    });
});
