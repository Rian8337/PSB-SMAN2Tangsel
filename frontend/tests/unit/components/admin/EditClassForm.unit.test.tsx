import { APIError } from "@/api";
import { EditClassForm } from "@/components/admin/EditClassForm";
import { ClassApiProvider } from "@/providers/api/class-api-provider";
import { Class } from "@psb/shared/types";
import { mockClassApiClient, mockRouter, mockToaster } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockClass: Class = {
    id: 10,
    name: "X MIPA 1",
    session: "2024/2025",
    semester: 1,
};

function render() {
    return renderWithChakraProvider(
        <ClassApiProvider client={mockClassApiClient}>
            <EditClassForm clazz={mockClass} />
        </ClassApiProvider>,
    );
}

describe("EditClassForm", () => {
    it("should initialize with the class data", () => {
        render();

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        expect(nameInput).toHaveValue("X MIPA 1");
    });

    it("should display validation error if name is empty", async () => {
        const user = userEvent.setup();

        render();

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        await user.clear(nameInput);

        await user.click(
            screen.getByRole("button", { name: "edit.submitButton" }),
        );

        expect(screen.getByText("missingFields")).toBeInTheDocument();
        expect(mockClassApiClient.updateClass).not.toHaveBeenCalled();
    });

    it("should display validation error if name exceeds maximum length", async () => {
        const user = userEvent.setup();

        render();

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        await user.clear(nameInput);
        await user.type(nameInput, "A".repeat(51));

        await user.click(
            screen.getByRole("button", { name: "edit.submitButton" }),
        );

        expect(screen.getByText(/validation\.maxLength/)).toBeInTheDocument();
        expect(mockClassApiClient.updateClass).not.toHaveBeenCalled();
    });

    it("should successfully update the class and redirect", async () => {
        const user = userEvent.setup();

        mockClassApiClient.updateClass.mockResolvedValue();

        render();

        const nameInput = screen.getByRole("textbox", {
            name: "fields.name.label",
        });

        await user.clear(nameInput);
        await user.type(nameInput, "XI IPS 2");

        await user.click(
            screen.getByRole("button", { name: "edit.submitButton" }),
        );

        await waitFor(() => {
            expect(mockClassApiClient.updateClass).toHaveBeenCalledWith(
                10,
                "XI IPS 2",
            );
        });

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "edit.toast.successTitle",
                type: "success",
            }),
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/admin/classes");
        expect(mockRouter.refresh).toHaveBeenCalledOnce();
    });

    it("handles API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Failed to update class due to duplicate name";

        mockClassApiClient.updateClass.mockRejectedValue(
            new APIError(409, errorMessage),
        );

        render();

        const submitButton = screen.getByRole("button", {
            name: "edit.submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockClassApiClient.updateClass).toHaveBeenCalled();
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
