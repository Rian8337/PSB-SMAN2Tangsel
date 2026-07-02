import { APIError } from "@/api";
import { ManageAssignmentForm } from "@/components/subjects/ManageAssignmentForm";
import { TeacherSubjectAssignment } from "@psb/shared/types";
import {
    mockRouter,
    mockSubjectAssignmentApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockAssignment: TeacherSubjectAssignment = {
    id: 5,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
    title: "Existing Title",
    description: "Existing description",
    dueAt: null,
    visible: false,
    createdAt: "2026-01-15T00:00:00.000Z",
    lastUpdatedAt: "2026-01-15T00:00:00.000Z",
    attachments: [{ id: 2, name: "soal.pdf" }],
};

function renderCreate() {
    return renderWithChakraProvider(
        <ManageAssignmentForm classSubjectId={10} />,
    );
}

function renderEdit() {
    return renderWithChakraProvider(
        <ManageAssignmentForm
            classSubjectId={10}
            assignment={mockAssignment}
        />,
    );
}

describe("ManageAssignmentForm (integration)", () => {
    describe("create mode", () => {
        it("should show the submit button with create label", () => {
            renderCreate();

            expect(
                screen.getByRole("button", { name: "submitCreate" }),
            ).toBeInTheDocument();
        });

        it("should call createAssignment with FormData on submit and redirect", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.createAssignment.mockResolvedValue(
                mockAssignment,
            );

            renderCreate();

            const titleInput = screen.getByRole("textbox", {
                name: "titleLabel",
            });

            await user.type(titleInput, "New Assignment");

            await user.click(
                screen.getByRole("button", { name: "submitCreate" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentApiClient.createAssignment,
                ).toHaveBeenCalledWith(expect.any(FormData));
            });

            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "createSuccessTitle",
                    type: "success",
                }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith("/24252/subjects/10");
            expect(mockRouter.refresh).toHaveBeenCalledOnce();
        });

        it("should show an error message and toast when createAssignment fails", async () => {
            const user = userEvent.setup();
            const errorMessage = "Failed to create";

            mockSubjectAssignmentApiClient.createAssignment.mockRejectedValue(
                new APIError(400, errorMessage),
            );

            renderCreate();

            await user.click(
                screen.getByRole("button", { name: "submitCreate" }),
            );

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "createErrorTitle",
                    type: "error",
                }),
            );

            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });

    describe("edit mode", () => {
        it("should pre-fill the form with the existing assignment data", () => {
            renderEdit();

            const titleInput = screen.getByRole("textbox", {
                name: "titleLabel",
            });

            expect(titleInput).toHaveValue("Existing Title");
        });

        it("should show the existing attachment", () => {
            renderEdit();

            expect(screen.getByDisplayValue("soal.pdf")).toBeInTheDocument();
        });

        it("should show the submit button with edit label", () => {
            renderEdit();

            expect(
                screen.getByRole("button", { name: "submitEdit" }),
            ).toBeInTheDocument();
        });

        it("should pre-fill the due date input using local time, not UTC", () => {
            vi.stubEnv("TZ", "Asia/Jakarta");

            const dueAt = "2026-07-05T16:30:00.000Z";

            renderWithChakraProvider(
                <ManageAssignmentForm
                    classSubjectId={10}
                    assignment={{ ...mockAssignment, dueAt }}
                />,
            );

            const dueAtInput = screen.getByLabelText("dueAtLabel");

            // 16:30 UTC is 23:30 in Asia/Jakarta (UTC+7).
            expect(dueAtInput).toHaveValue("2026-07-05T23:30");

            vi.unstubAllEnvs();
        });

        it("should convert the due date to a UTC ISO string before submitting", async () => {
            vi.stubEnv("TZ", "Asia/Jakarta");

            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.updateAssignment.mockResolvedValue(
                undefined,
            );

            renderEdit();

            const dueAtInput = screen.getByLabelText("dueAtLabel");

            // 10:00 in Asia/Jakarta (UTC+7) is 03:00 UTC.
            await user.type(dueAtInput, "2026-08-01T10:00");

            await user.click(
                screen.getByRole("button", { name: "submitEdit" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentApiClient.updateAssignment,
                ).toHaveBeenCalled();
            });

            const formData =
                mockSubjectAssignmentApiClient.updateAssignment.mock
                    .calls[0][1];

            expect(formData.get("dueAt")).toBe("2026-08-01T03:00:00.000Z");

            vi.unstubAllEnvs();
        });

        it("should call updateAssignment with FormData on submit and redirect", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.updateAssignment.mockResolvedValue(
                undefined,
            );

            renderEdit();

            await user.click(
                screen.getByRole("button", { name: "submitEdit" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentApiClient.updateAssignment,
                ).toHaveBeenCalledWith(5, expect.any(FormData));
            });

            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "editSuccessTitle",
                    type: "success",
                }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith(
                "/24252/subjects/10/assignments/5",
            );
        });

        it("should mark an attachment as deleted when its delete button is clicked", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.updateAssignment.mockResolvedValue(
                undefined,
            );

            renderEdit();

            const deleteButtons = screen.getAllByRole("button", {
                name: "deleteAttachmentLabel",
            });

            await user.click(deleteButtons[0]);

            expect(
                screen.queryByDisplayValue("soal.pdf"),
            ).not.toBeInTheDocument();
        });

        it("should show an error message and toast when updateAssignment fails", async () => {
            const user = userEvent.setup();
            const errorMessage = "Failed to update";

            mockSubjectAssignmentApiClient.updateAssignment.mockRejectedValue(
                new APIError(400, errorMessage),
            );

            renderEdit();

            await user.click(
                screen.getByRole("button", { name: "submitEdit" }),
            );

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "editErrorTitle",
                    type: "error",
                }),
            );
        });
    });
});
