import { APIError } from "@/api";
import { EditSubjectForm } from "@/components/admin/EditSubjectForm";
import { SubjectApiProvider } from "@/providers/api/subject-api-provider";
import { Subject } from "@psb/shared/types";
import { mockRouter, mockSubjectApiClient, mockToaster } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSubject: Subject = {
    id: 42,
    code: "FIS-XI",
    name: "Fisika Dasar",
    active: true,
};

function render() {
    return renderWithChakraProvider(
        <SubjectApiProvider client={mockSubjectApiClient}>
            <EditSubjectForm subject={mockSubject} />
        </SubjectApiProvider>,
    );
}

describe("EditSubjectForm (unit)", () => {
    it("should initialize with the subject data", () => {
        render();

        const codeInput = screen.getByRole("textbox", {
            name: "fields.code.label",
        });

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        const activeSwitch = screen.getByRole("checkbox", {
            name: "fields.active.label",
        });

        expect(codeInput).toHaveValue("FIS-XI");
        expect(nameInput).toHaveValue("Fisika Dasar");
        expect(activeSwitch).toBeChecked();
    });

    it("should validate the subject code format", async () => {
        const user = userEvent.setup();

        render();

        const codeInput = screen.getByRole("textbox", {
            name: "fields.code.label",
        });

        await user.clear(codeInput);
        await user.type(codeInput, "invalid code @!");

        await user.click(
            screen.getByRole("button", { name: "edit.submitButton" }),
        );

        expect(screen.getByText("validation.invalidCode")).toBeInTheDocument();
        expect(mockSubjectApiClient.updateSubject).not.toHaveBeenCalled();
    });

    it("should successfully update the subject and redirect", async () => {
        const user = userEvent.setup();

        mockSubjectApiClient.updateSubject.mockResolvedValue();

        render();

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        await user.clear(nameInput);
        await user.type(nameInput, "Fisika Lanjutan");

        await user.click(
            screen.getByRole("button", { name: "edit.submitButton" }),
        );

        await waitFor(() => {
            expect(mockSubjectApiClient.updateSubject).toHaveBeenCalledWith(
                42,
                "FIS-XI",
                "Fisika Lanjutan",
                true,
            );
        });

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "edit.toast.successTitle",
                type: "success",
            }),
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/admin/subjects");
        expect(mockRouter.refresh).toHaveBeenCalledOnce();
    });

    it("handles API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Failed to update subject";

        mockSubjectApiClient.updateSubject.mockRejectedValue(
            new APIError(400, errorMessage),
        );

        render();

        const submitButton = screen.getByRole("button", {
            name: "edit.submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockSubjectApiClient.updateSubject).toHaveBeenCalled();
        });

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "edit.toast.errorTitle",
                type: "error",
            }),
        );

        expect(mockRouter.push).not.toHaveBeenCalled();
    });
});
