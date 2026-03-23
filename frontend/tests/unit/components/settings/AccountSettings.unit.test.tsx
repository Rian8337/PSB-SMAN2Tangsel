import { APIError } from "@/api";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { UserApiProvider } from "@/providers/api/user-api-provider";
import { mockToaster, mockUserApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { fireEvent, screen, waitFor } from "@testing-library/react";

function renderComponent() {
    return renderWithChakraProvider(
        <UserApiProvider client={mockUserApiClient}>
            <AccountSettings />
        </UserApiProvider>,
    );
}

describe("AccountSettings (unit)", () => {
    it("should render the form correctly", () => {
        renderComponent();

        expect(screen.getByText("title")).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText("currentPasswordPlaceholder"),
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText("newPasswordPlaceholder"),
        ).toBeInTheDocument();

        expect(screen.getByText("passwordRequirements")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "passwordFormSubmit" }),
        ).toBeInTheDocument();
    });

    it("should show an error if fields are submitted empty", () => {
        const { container } = renderComponent();

        const form = container.querySelector("form")!;

        fireEvent.submit(form);

        expect(screen.getByText("formMissingFields")).toBeInTheDocument();
        expect(mockUserApiClient.updatePassword).not.toHaveBeenCalled();
    });

    it("should show an error if new password does not meet requirements", () => {
        renderComponent();

        fireEvent.change(
            screen.getByPlaceholderText("currentPasswordPlaceholder"),
            {
                target: { value: "OldPassword1!" },
            },
        );

        fireEvent.change(
            screen.getByPlaceholderText("newPasswordPlaceholder"),
            {
                target: { value: "short" },
            },
        );

        const submitButton = screen.getByRole("button", {
            name: "passwordFormSubmit",
        });

        fireEvent.click(submitButton);

        expect(screen.getByText("invalidNewPassword")).toBeInTheDocument();

        expect(mockUserApiClient.updatePassword).not.toHaveBeenCalled();
    });

    it("should call API to update password and display success toast if validations pass", async () => {
        mockUserApiClient.updatePassword.mockResolvedValue(undefined);

        renderComponent();

        const currentPasswordInput =
            screen.getByPlaceholderText<HTMLInputElement>(
                "currentPasswordPlaceholder",
            );

        const newPasswordInput = screen.getByPlaceholderText<HTMLInputElement>(
            "newPasswordPlaceholder",
        );

        const submitButton = screen.getByRole("button", {
            name: "passwordFormSubmit",
        });

        fireEvent.change(currentPasswordInput, {
            target: { value: "OldPassword1!" },
        });

        fireEvent.change(newPasswordInput, {
            target: { value: "NewPassword1!" },
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUserApiClient.updatePassword).toHaveBeenCalledWith(
                "OldPassword1!",
                "NewPassword1!",
            );
        });

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                title: "passwordToastSuccessTitle",
                description: "passwordToastSuccessMessage",
            }),
        );

        expect(currentPasswordInput.value).toBe("");
        expect(newPasswordInput.value).toBe("");
    });

    it("should display an error toast if API call fails", async () => {
        mockUserApiClient.updatePassword.mockRejectedValue(
            new APIError(400, "Invalid password"),
        );

        renderComponent();

        const currentPasswordInput =
            screen.getByPlaceholderText<HTMLInputElement>(
                "currentPasswordPlaceholder",
            );

        const newPasswordInput = screen.getByPlaceholderText<HTMLInputElement>(
            "newPasswordPlaceholder",
        );

        const submitButton = screen.getByRole("button", {
            name: "passwordFormSubmit",
        });

        fireEvent.change(currentPasswordInput, {
            target: { value: "OldPassword1!" },
        });

        fireEvent.change(newPasswordInput, {
            target: { value: "NewPassword1!" },
        });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUserApiClient.updatePassword).toHaveBeenCalledWith(
                "OldPassword1!",
                "NewPassword1!",
            );
        });

        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                title: "passwordToastErrorTitle",
                description: "passwordToastErrorMessage",
            }),
        );

        expect(currentPasswordInput.value).toBe("OldPassword1!");
        expect(newPasswordInput.value).toBe("NewPassword1!");
    });
});
