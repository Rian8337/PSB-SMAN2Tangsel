import { ManageAssignmentSubmissionForm } from "@/components/subjects/ManageAssignmentSubmissionForm";
import { SubjectAssignmentSubmissionApiProvider } from "@/providers/api/subject-assignment-submission-api-provider";
import { SubjectAssignmentSubmission } from "@psb/shared/types";
import {
    mockSubjectAssignmentSubmissionApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSubmission: SubjectAssignmentSubmission = {
    id: 5,
    submittedAt: "2026-02-20T10:00:00.000Z",
    attachments: [{ id: 10, name: "report.pdf" }],
};

function renderCreate(onSuccess = vi.fn(), onCancel = vi.fn()) {
    return renderWithChakraProvider(
        <SubjectAssignmentSubmissionApiProvider
            client={mockSubjectAssignmentSubmissionApiClient}
        >
            <ManageAssignmentSubmissionForm
                assignmentId={1}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </SubjectAssignmentSubmissionApiProvider>,
    );
}

function renderEdit(onSuccess = vi.fn(), onCancel = vi.fn()) {
    return renderWithChakraProvider(
        <SubjectAssignmentSubmissionApiProvider
            client={mockSubjectAssignmentSubmissionApiClient}
        >
            <ManageAssignmentSubmissionForm
                assignmentId={1}
                submission={mockSubmission}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </SubjectAssignmentSubmissionApiProvider>,
    );
}

describe("ManageAssignmentSubmissionForm (integration)", () => {
    describe("create mode", () => {
        it("should show the file input and submit button", () => {
            renderCreate();

            expect(
                screen.getByLabelText("addFilesLabel"),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("button", { name: "submitCreate" }),
            ).toBeInTheDocument();
        });

        it("should not show a cancel button in create mode", () => {
            renderCreate();

            expect(
                screen.queryByRole("button", { name: "cancelButton" }),
            ).not.toBeInTheDocument();
        });

        it("should call createSubmission and invoke onSuccess on submit", async () => {
            const user = userEvent.setup();
            const onSuccess = vi.fn();

            mockSubjectAssignmentSubmissionApiClient.createSubmission.mockResolvedValue(
                mockSubmission,
            );

            renderCreate(onSuccess);

            await user.click(
                screen.getByRole("button", { name: "submitCreate" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentSubmissionApiClient.createSubmission,
                ).toHaveBeenCalledWith(1, expect.any(FormData));
            });

            expect(onSuccess).toHaveBeenCalled();
        });

        it("should show an error toast when createSubmission fails", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentSubmissionApiClient.createSubmission.mockRejectedValue(
                new Error("Network error"),
            );

            renderCreate();

            await user.click(
                screen.getByRole("button", { name: "submitCreate" }),
            );

            await waitFor(() => {
                expect(mockToaster.create).toHaveBeenCalledWith(
                    expect.objectContaining({ type: "error" }),
                );
            });
        });
    });

    describe("edit mode", () => {
        it("should show existing attachments and submit/cancel buttons", () => {
            renderEdit();

            expect(screen.getByDisplayValue("report.pdf")).toBeInTheDocument();

            expect(
                screen.getByRole("button", { name: "submitEdit" }),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("button", { name: "cancelButton" }),
            ).toBeInTheDocument();
        });

        it("should call onCancel when the cancel button is clicked", async () => {
            const user = userEvent.setup();
            const onCancel = vi.fn();

            renderEdit(vi.fn(), onCancel);

            await user.click(
                screen.getByRole("button", { name: "cancelButton" }),
            );

            expect(onCancel).toHaveBeenCalled();
        });

        it("should call updateSubmission and invoke onSuccess on save", async () => {
            const user = userEvent.setup();
            const onSuccess = vi.fn();

            mockSubjectAssignmentSubmissionApiClient.updateSubmission.mockResolvedValue(
                undefined,
            );

            renderEdit(onSuccess);

            await user.click(
                screen.getByRole("button", { name: "submitEdit" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentSubmissionApiClient.updateSubmission,
                ).toHaveBeenCalledWith(1, expect.any(FormData));
            });

            expect(onSuccess).toHaveBeenCalled();
        });

        it("should mark attachment as deleted when delete button is clicked", async () => {
            const user = userEvent.setup();

            renderEdit();

            expect(screen.getByDisplayValue("report.pdf")).toBeInTheDocument();

            await user.click(
                screen.getByRole("button", { name: "deleteAttachmentLabel" }),
            );

            await waitFor(() => {
                expect(
                    screen.queryByDisplayValue("report.pdf"),
                ).not.toBeInTheDocument();
            });
        });
    });
});
