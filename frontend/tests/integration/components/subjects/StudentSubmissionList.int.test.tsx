import { StudentSubmissionList } from "@/components/subjects/StudentSubmissionList";
import {
    AssignmentSubmissionRow,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import {
    mockSubjectAssignmentApiClient,
    mockSubjectAssignmentSubmissionApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockTeacherAssignment: TeacherSubjectAssignment = {
    id: 1,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    title: "Latihan Persamaan Linear",
    description: null,
    dueAt: "2026-02-21T18:00:00.000Z",
    visible: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    lastUpdatedAt: "2026-01-23T00:00:00.000Z",
    attachments: [],
};

const earlySubmission: AssignmentSubmissionRow = {
    studentId: 3,
    studentIdentifier: "0019217804",
    studentName: "Reza Mouna Hendrian",
    submittedAt: "2026-02-18T12:57:32.000Z", // before dueAt
};

const lateSubmission: AssignmentSubmissionRow = {
    studentId: 4,
    studentIdentifier: "0019217805",
    studentName: "Test User 1",
    submittedAt: "2026-02-28T21:43:11.000Z", // after dueAt
};

function render() {
    return renderWithChakraProvider(
        <StudentSubmissionList assignmentId={1} classSubjectId={10} />,
    );
}

describe("StudentSubmissionList (integration)", () => {
    beforeEach(() => {
        vi.stubGlobal("URL", {
            createObjectURL: vi.fn(() => "blob:test"),
            revokeObjectURL: vi.fn(),
        });

        mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue(
            mockTeacherAssignment,
        );
        mockSubjectAssignmentSubmissionApiClient.getSubmissions.mockResolvedValue(
            [earlySubmission, lateSubmission],
        );
        mockSubjectAssignmentSubmissionApiClient.downloadSubmissions.mockResolvedValue(
            { blob: new Blob(["zip"]), filename: "submissions-1.zip" },
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should call getAssignment and getSubmissions with the correct assignment ID on mount", () => {
        render();

        expect(
            mockSubjectAssignmentApiClient.getAssignment,
        ).toHaveBeenCalledWith(1, expect.any(AbortSignal));

        expect(
            mockSubjectAssignmentSubmissionApiClient.getSubmissions,
        ).toHaveBeenCalledWith(1, expect.any(AbortSignal));
    });

    it("should display student names and identifiers after loading", async () => {
        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();

            expect(screen.getByText("Test User 1")).toBeInTheDocument();
            expect(screen.getByText("0019217804")).toBeInTheDocument();
            expect(screen.getByText("0019217805")).toBeInTheDocument();
        });
    });

    it("should display no submissions message when list is empty", async () => {
        mockSubjectAssignmentSubmissionApiClient.getSubmissions.mockResolvedValue(
            [],
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("noSubmissions")).toBeInTheDocument();
        });
    });

    it("should filter submissions by student name when searching", async () => {
        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText("search");
        searchInput.focus();

        const user = userEvent.setup();
        await user.type(searchInput, "Test");

        await waitFor(() => {
            expect(
                screen.queryByText("Reza Mouna Hendrian"),
            ).not.toBeInTheDocument();

            expect(screen.getByText("Test User 1")).toBeInTheDocument();
        });
    });

    it("should show green color for early submission and red for late submission", async () => {
        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();
        });

        const times = screen.getAllByText(/.+/);

        const earlyEl = times.find((el) =>
            el.textContent.includes(
                new Date(earlySubmission.submittedAt).toLocaleString(),
            ),
        );

        const lateEl = times.find((el) =>
            el.textContent.includes(
                new Date(lateSubmission.submittedAt).toLocaleString(),
            ),
        );

        expect(earlyEl).toBeDefined();
        expect(lateEl).toBeDefined();
    });

    it("should call downloadSubmissions with only the assignmentId when Download All is clicked", async () => {
        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();
        });

        const user = userEvent.setup();
        await user.click(screen.getByText("downloadAll"));

        expect(
            mockSubjectAssignmentSubmissionApiClient.downloadSubmissions,
        ).toHaveBeenCalledWith(1);
    });

    it("should call downloadSubmissions with assignmentId and studentId when a per-row Download is clicked", async () => {
        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();
        });

        const user = userEvent.setup();
        const downloadButtons = screen.getAllByText("download");

        await user.click(downloadButtons[0]);

        expect(
            mockSubjectAssignmentSubmissionApiClient.downloadSubmissions,
        ).toHaveBeenCalledWith(1, earlySubmission.studentId);
    });

    it("should call toaster.create with an error when Download All fails", async () => {
        mockSubjectAssignmentSubmissionApiClient.downloadSubmissions.mockRejectedValue(
            new Error("Network error"),
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("Reza Mouna Hendrian")).toBeInTheDocument();
        });

        const user = userEvent.setup();
        await user.click(screen.getByText("downloadAll"));

        await waitFor(() => {
            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error" }),
            );
        });
    });
});
