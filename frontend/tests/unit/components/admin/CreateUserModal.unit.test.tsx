import { APIError } from "@/api";
import {
    CreateUserModal,
    CreateUserModalProps,
} from "@/components/admin/CreateUserModal";
import { UserRole } from "@psb/shared/types";
import { mockToaster, mockUserApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function renderModal(props: Partial<CreateUserModalProps> = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onSuccess = props.onSuccess ?? vi.fn();

    renderWithChakraProvider(
        <CreateUserModal
            isOpen={props.isOpen ?? true}
            onClose={onClose}
            onSuccess={onSuccess}
        />,
    );

    return { onClose, onSuccess };
}

describe("CreateUserModal (unit)", () => {
    it("renders the modal with all form fields when open", () => {
        renderModal();

        expect(
            screen.getByRole("heading", { name: "createUser.dialog.title" }),
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText("createUser.dialog.namePlaceholder"),
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(
                "createUser.dialog.identifierPlaceholder",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("combobox", {
                name: "createUser.dialog.roleLabel",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(
                "createUser.dialog.passwordPlaceholder",
            ),
        ).toBeInTheDocument();
    });

    it("shows a validation error if required fields are missing", async () => {
        const user = userEvent.setup();

        renderModal();

        const submitButton = screen.getByRole("button", {
            name: "createUser.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(await screen.findByText("missingFields")).toBeInTheDocument();
        expect(mockUserApiClient.createUser).not.toHaveBeenCalled();
    });

    it("shows a validation error if the password does not meet requirements", async () => {
        const user = userEvent.setup();

        renderModal();

        await user.type(
            screen.getByPlaceholderText("createUser.dialog.namePlaceholder"),
            "Test",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.identifierPlaceholder",
            ),
            "12345",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.passwordPlaceholder",
            ),
            "weak",
        );

        const submitButton = screen.getByRole("button", {
            name: "createUser.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("passwordRequirements"),
        ).toBeInTheDocument();

        expect(mockUserApiClient.createUser).not.toHaveBeenCalled();
    });

    it("submits the form successfully and triggers callbacks", async () => {
        const user = userEvent.setup();
        mockUserApiClient.createUser.mockResolvedValueOnce(undefined);

        const { onClose, onSuccess } = renderModal();

        await user.type(
            screen.getByPlaceholderText("createUser.dialog.namePlaceholder"),
            "Test User",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.identifierPlaceholder",
            ),
            "12345",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.passwordPlaceholder",
            ),
            "StrongPassword!23",
        );

        await user.selectOptions(
            screen.getByRole("combobox", {
                name: "createUser.dialog.roleLabel",
            }),
            UserRole.teacher.toString(),
        );

        const submitButton = screen.getByRole("button", {
            name: "createUser.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(mockUserApiClient.createUser).toHaveBeenCalledWith(
            "Test User",
            "StrongPassword!23",
            UserRole.teacher,
            "12345",
        );

        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("handles API errors gracefully and shows an error toast", async () => {
        const user = userEvent.setup();

        mockUserApiClient.createUser.mockRejectedValueOnce(
            new APIError(400, "User already exists"),
        );

        const { onClose, onSuccess } = renderModal();

        await user.type(
            screen.getByPlaceholderText("createUser.dialog.namePlaceholder"),
            "Test User",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.identifierPlaceholder",
            ),
            "12345",
        );

        await user.type(
            screen.getByPlaceholderText(
                "createUser.dialog.passwordPlaceholder",
            ),
            "StrongPassword!23",
        );

        const submitButton = screen.getByRole("button", {
            name: "createUser.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("User already exists"),
        ).toBeInTheDocument();

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
        );
    });

    it("resets the form and closes when the cancel button is clicked", async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal();

        const nameInput = screen.getByPlaceholderText(
            "createUser.dialog.namePlaceholder",
        );

        const idInput = screen.getByPlaceholderText(
            "createUser.dialog.identifierPlaceholder",
        );

        const roleSelect = screen.getByRole("combobox");

        const passwordInput = screen.getByPlaceholderText(
            "createUser.dialog.passwordPlaceholder",
        );

        await user.type(nameInput, "Test User");
        await user.type(idInput, "12345");
        await user.selectOptions(roleSelect, UserRole.student.toString());
        await user.type(passwordInput, "StrongPassword!23");

        await user.click(
            screen.getByRole("button", {
                name: "createUser.dialog.cancelButton",
            }),
        );

        expect(onClose).toHaveBeenCalled();

        expect(nameInput).toHaveValue("");
        expect(idInput).toHaveValue("");
        expect(roleSelect).toHaveValue(UserRole.student.toString());
        expect(passwordInput).toHaveValue("");
    });
});
