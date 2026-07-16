import { SubmissionAnalytics } from "@/components/analytics/SubmissionAnalytics";
import {
    StudentSubmissionConcern,
    SubmissionAnalytics as SubmissionAnalyticsData,
} from "@psb/shared/types";
import { mockAnalyticsApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";

const mockConcerningStudents: StudentSubmissionConcern[] = [
    {
        studentId: 1,
        studentIdentifier: "0012345678",
        studentName: "Budi Santoso",
        lateCount: 2,
        missingCount: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1" },
    },
    {
        studentId: 2,
        studentIdentifier: "0012345679",
        studentName: "Siti Aminah",
        lateCount: 0,
        missingCount: 3,
        classSubjectId: 20,
        subject: { id: 2, code: "FIS1", name: "Fisika" },
        class: { id: 2, name: "X-IPA-2" },
    },
];

const mockAnalyticsData: SubmissionAnalyticsData = {
    summary: { onTime: 20, late: 5, missing: 3, pending: 2 },
    concerningStudents: mockConcerningStudents,
};

function render() {
    return renderWithChakraProvider(
        <SubmissionAnalytics session="2024/2025" semester={1} />,
    );
}

describe("SubmissionAnalytics (integration)", () => {
    it("should call getSubmissionAnalytics with the given session and semester on mount", () => {
        mockAnalyticsApiClient.getSubmissionAnalytics.mockResolvedValue({
            summary: { onTime: 0, late: 0, missing: 0, pending: 0 },
            concerningStudents: [],
        });

        render();

        expect(
            mockAnalyticsApiClient.getSubmissionAnalytics,
        ).toHaveBeenCalledWith("2024/2025", 1, 5, expect.any(AbortSignal));
    });

    it("should display the summary tiles and concerning students list after loading", async () => {
        mockAnalyticsApiClient.getSubmissionAnalytics.mockResolvedValue(
            mockAnalyticsData,
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("title")).toBeInTheDocument();
            expect(screen.getByText("concernListTitle")).toBeInTheDocument();

            expect(screen.getByText("20")).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();

            expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
            expect(
                screen.getByText("Matematika Wajib · X-IPA-1"),
            ).toBeInTheDocument();
            expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
            expect(screen.getByText("Fisika · X-IPA-2")).toBeInTheDocument();
        });
    });

    it("should show the positive empty state when there is assignment data but no concerning students", async () => {
        mockAnalyticsApiClient.getSubmissionAnalytics.mockResolvedValue({
            summary: { onTime: 10, late: 0, missing: 0, pending: 1 },
            concerningStudents: [],
        });

        render();

        await waitFor(() => {
            expect(screen.getByText("title")).toBeInTheDocument();
            expect(screen.getByText("noConcerns")).toBeInTheDocument();
        });
    });

    it("should show the empty state when there is no assignment data at all", async () => {
        mockAnalyticsApiClient.getSubmissionAnalytics.mockResolvedValue({
            summary: { onTime: 0, late: 0, missing: 0, pending: 0 },
            concerningStudents: [],
        });

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });

        expect(screen.queryByText("noConcerns")).not.toBeInTheDocument();
        expect(screen.queryByText("title")).not.toBeInTheDocument();
    });
});
