import { APIError } from "@/api";
import { EditUserForm } from "@/components/admin/EditUserForm";
import { UserListItem, UserRole } from "@psb/shared/types";
import { mockRouter, mockToaster, mockUserApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUser: UserListItem = {
    id: 1,
    active: true,
    identifier: "1234567890",
    name: "John Doe",
    role: UserRole.Student,
};

function render(currentUserId = 2) {
    return renderWithChakraProvider(
        <EditUserForm user={mockUser} currentUserId={currentUserId} />,
    );
}

describe("EditUserForm (unit)", () => {
    it("renders the form with initial user data", () => {
        render();

        expect(
            screen.getByRole("heading", { name: "title" }),
        ).toBeInTheDocument();

        const identifierInput = screen.getByDisplayValue<HTMLInputElement>(
            mockUser.identifier,
        );

        expect(identifierInput).toBeInTheDocument();
        expect(identifierInput.value).toBe(mockUser.identifier);
        expect(identifierInput).toBeEnabled();

        const nameInput = screen.getByDisplayValue<HTMLInputElement>(
            mockUser.name,
        );

        expect(nameInput).toBeInTheDocument();
        expect(nameInput.value).toBe(mockUser.name);
        expect(nameInput).toBeEnabled();

        const activeSwitch = screen.getByRole<HTMLInputElement>("checkbox");

        expect(activeSwitch).toBeInTheDocument();
        expect(activeSwitch.checked).toBe(mockUser.active);
        expect(activeSwitch).toBeEnabled();
    });

    it("shows a validation error if name is empty", async () => {
        const user = userEvent.setup();

        render();

        const nameInput = screen.getByDisplayValue(mockUser.name);

        const updateButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(nameInput);
        await user.type(nameInput, "   ");
        await user.click(updateButton);

        expect(mockUserApiClient.updateUser).not.toHaveBeenCalled();
        expect(await screen.findByText("missingFields")).toBeInTheDocument();
    });

    it("shows a validation error if identifier is empty", async () => {
        const user = userEvent.setup();

        render();

        const identifierInput = screen.getByDisplayValue(
            mockUser.identifier,
        );

        const updateButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(identifierInput);
        await user.type(identifierInput, "   ");
        await user.click(updateButton);

        expect(mockUserApiClient.updateUser).not.toHaveBeenCalled();
        expect(await screen.findByText("missingFields")).toBeInTheDocument();
    });

    it("disables the active switch when editing own user", () => {
        render(1);

        const activeSwitch = screen.getByRole("checkbox");
        expect(activeSwitch).toBeDisabled();
    });

    it("submits successfully and redirects", async () => {
        const user = userEvent.setup();
        mockUserApiClient.updateUser.mockResolvedValueOnce(undefined);

        render();

        const nameInput = screen.getByDisplayValue(mockUser.name);
        const activeSwitch = screen.getByRole("checkbox");

        const updateButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(nameInput);
        await user.type(nameInput, "Jane Doe");
        await user.click(activeSwitch.closest("label")!);
        await user.click(updateButton);

        await waitFor(() => {
            expect(mockUserApiClient.updateUser).toHaveBeenCalledWith(
                1,
                "Jane Doe",
                mockUser.identifier,
                false,
            );
        });

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "toast.successTitle",
                type: "success",
            }),
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/admin/users");
        expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it("handles API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Bad Request";

        mockUserApiClient.updateUser.mockRejectedValueOnce(
            new APIError(400, errorMessage),
        );

        render();

        const submitButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockUserApiClient.updateUser).toHaveBeenCalled();
        });

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "toast.errorTitle",
                type: "error",
            }),
        );

        expect(mockRouter.push).not.toHaveBeenCalled();
    });
});
