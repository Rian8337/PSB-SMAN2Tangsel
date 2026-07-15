import { DownloadAnalytics } from "@/components/analytics/DownloadAnalytics";
import {
    DownloadAnalytics as DownloadAnalyticsData,
    TopDownloadedAttachment,
} from "@psb/shared/types";
import { mockAnalyticsApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";

const mockTopAttachments: TopDownloadedAttachment[] = [
    {
        attachmentId: 1,
        name: "chapter-1.pdf",
        downloadCount: 12,
        type: "material",
        contentId: 100,
        contentTitle: "Chapter 1",
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1" },
    },
    {
        attachmentId: 2,
        name: "assignment-1.pdf",
        downloadCount: 8,
        type: "assignment",
        contentId: 200,
        contentTitle: "Tugas 1",
        classSubjectId: 20,
        subject: { id: 2, code: "FIS1", name: "Fisika" },
        class: { id: 2, name: "X-IPA-2" },
    },
];

const mockAnalyticsData: DownloadAnalyticsData = {
    timeSeries: [
        { weekStart: "2026-06-29", count: 5 },
        { weekStart: "2026-07-06", count: 15 },
    ],
    topAttachments: mockTopAttachments,
};

function render() {
    return renderWithChakraProvider(
        <DownloadAnalytics session="2024/2025" semester={1} />,
    );
}

describe("DownloadAnalytics (integration)", () => {
    it("should call getDownloadAnalytics with the given session and semester on mount", () => {
        mockAnalyticsApiClient.getDownloadAnalytics.mockResolvedValue({
            timeSeries: [],
            topAttachments: [],
        });

        render();

        expect(
            mockAnalyticsApiClient.getDownloadAnalytics,
        ).toHaveBeenCalledWith("2024/2025", 1, 5, expect.any(AbortSignal));
    });

    it("should display the chart and top attachments after loading", async () => {
        mockAnalyticsApiClient.getDownloadAnalytics.mockResolvedValue(
            mockAnalyticsData,
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("chartTitle")).toBeInTheDocument();
            expect(screen.getByText("topListTitle")).toBeInTheDocument();
            expect(screen.getByText("Chapter 1")).toBeInTheDocument();
            expect(
                screen.getByText("Matematika Wajib · X-IPA-1"),
            ).toBeInTheDocument();
            expect(screen.getByText("12")).toBeInTheDocument();
            expect(screen.getByText("Tugas 1")).toBeInTheDocument();
            expect(screen.getByText("Fisika · X-IPA-2")).toBeInTheDocument();
            expect(screen.getByText("8")).toBeInTheDocument();
        });
    });

    it("should link to the material detail page for material attachments", async () => {
        mockAnalyticsApiClient.getDownloadAnalytics.mockResolvedValue(
            mockAnalyticsData,
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("Chapter 1").closest("a")).toHaveAttribute(
                "href",
                "/24252/subjects/10/materials/100",
            );
        });
    });

    it("should link to the assignment detail page for assignment attachments", async () => {
        mockAnalyticsApiClient.getDownloadAnalytics.mockResolvedValue(
            mockAnalyticsData,
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("Tugas 1").closest("a")).toHaveAttribute(
                "href",
                "/24252/subjects/20/assignments/200",
            );
        });
    });

    it("should show the empty state when there are no top attachments", async () => {
        mockAnalyticsApiClient.getDownloadAnalytics.mockResolvedValue({
            timeSeries: [],
            topAttachments: [],
        });

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });
});
