import { APIError } from "@/api";
import { ManageMaterialForm } from "@/components/subjects/ManageMaterialForm";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { SubjectMaterialApiProvider } from "@/providers/api/subject-material-api-provider";
import { SubjectMaterial as SubjectMaterialData } from "@psb/shared/types";
import {
    mockNotificationApiClient,
    mockRouter,
    mockSubjectMaterialApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMaterial: SubjectMaterialData = {
    id: 5,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    title: "Existing Title",
    description: "Existing description",
    visible: false,
    createdAt: "2024-01-15T00:00:00.000Z",
    lastUpdatedAt: "2024-01-15T00:00:00.000Z",
    attachments: [{ id: 2, name: "notes.pdf" }],
};

function renderCreate() {
    return renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <SubjectMaterialApiProvider client={mockSubjectMaterialApiClient}>
                <ManageMaterialForm classSubjectId={10} />
            </SubjectMaterialApiProvider>
        </NotificationApiProvider>,
    );
}

function renderEdit() {
    return renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <SubjectMaterialApiProvider client={mockSubjectMaterialApiClient}>
                <ManageMaterialForm
                    classSubjectId={10}
                    material={mockMaterial}
                />
            </SubjectMaterialApiProvider>
        </NotificationApiProvider>,
    );
}

describe("ManageMaterialForm (integration)", () => {
    describe("create mode", () => {
        it("should show the submit button with create label", () => {
            renderCreate();

            expect(
                screen.getByRole("button", { name: "submitCreate" }),
            ).toBeInTheDocument();
        });

        it("should call createMaterial with FormData on submit and redirect", async () => {
            const user = userEvent.setup();

            mockSubjectMaterialApiClient.createMaterial.mockResolvedValue(
                mockMaterial,
            );

            renderCreate();

            const titleInput = screen.getByRole("textbox", {
                name: "titleLabel",
            });

            await user.type(titleInput, "New Material");

            await user.click(
                screen.getByRole("button", { name: "submitCreate" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectMaterialApiClient.createMaterial,
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

        it("should show an error message and toast when createMaterial fails", async () => {
            const user = userEvent.setup();
            const errorMessage = "Failed to create";

            mockSubjectMaterialApiClient.createMaterial.mockRejectedValue(
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
        it("should pre-fill the form with the existing material data", () => {
            renderEdit();

            const titleInput = screen.getByRole("textbox", {
                name: "titleLabel",
            });

            expect(titleInput).toHaveValue("Existing Title");
        });

        it("should show the existing attachment", () => {
            renderEdit();

            expect(screen.getByDisplayValue("notes.pdf")).toBeInTheDocument();
        });

        it("should show the submit button with edit label", () => {
            renderEdit();

            expect(
                screen.getByRole("button", { name: "submitEdit" }),
            ).toBeInTheDocument();
        });

        it("should call updateMaterial with FormData on submit and redirect", async () => {
            const user = userEvent.setup();

            mockSubjectMaterialApiClient.updateMaterial.mockResolvedValue(
                undefined,
            );

            renderEdit();

            await user.click(
                screen.getByRole("button", { name: "submitEdit" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectMaterialApiClient.updateMaterial,
                ).toHaveBeenCalledWith(5, expect.any(FormData));
            });

            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "editSuccessTitle",
                    type: "success",
                }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith("/24252/subjects/10/materials/5");
        });

        it("should mark an attachment as deleted when its delete button is clicked", async () => {
            const user = userEvent.setup();

            mockSubjectMaterialApiClient.updateMaterial.mockResolvedValue(
                undefined,
            );

            renderEdit();

            const deleteButtons = screen.getAllByRole("button", {
                name: "deleteAttachmentLabel",
            });

            await user.click(deleteButtons[0]);

            expect(
                screen.queryByDisplayValue("notes.pdf"),
            ).not.toBeInTheDocument();
        });

        it("should show an error message and toast when updateMaterial fails", async () => {
            const user = userEvent.setup();
            const errorMessage = "Failed to update";

            mockSubjectMaterialApiClient.updateMaterial.mockRejectedValue(
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
