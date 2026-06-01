import { APIError } from "@/api";
import {
    CreateSessionModal,
    CreateSessionModalProps,
} from "@/components/admin/CreateSessionModal";
import { mockSessionApiClient, mockToaster } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

function renderModal(props: Partial<CreateSessionModalProps> = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onSuccess = props.onSuccess ?? vi.fn();

    const renderResult = renderWithChakraProvider(
        <CreateSessionModal
            isOpen={props.isOpen ?? true}
            onClose={onClose}
            onSuccess={onSuccess}
        />,
    );

    return { onClose, onSuccess, ...renderResult };
}

describe("CreateSessionModal (unit)", () => {
    const currentYear = new Date().getFullYear();
    const defaultSession = `${currentYear.toString()}/${(currentYear + 1).toString()}`;

    it("renders the modal with all form fields and defaults with open", () => {
        renderModal();

        expect(
            screen.getByRole("heading", { name: "dialog.title" }),
        ).toBeInTheDocument();

        const sessionInput = screen.getByLabelText("dialog.session.label");
        expect(sessionInput).toBeInTheDocument();
        expect(sessionInput).toHaveValue(defaultSession);

        expect(
            screen.getByRole("combobox", { name: "dialog.semester.label" }),
        ).toBeInTheDocument();

        const activeSwitch = screen.getByRole("checkbox");
        expect(activeSwitch).toBeInTheDocument();
        expect(activeSwitch).not.toBeChecked();
    });

    it("shows a validation error if required fields are missing", async () => {
        const user = userEvent.setup();

        renderModal();

        const sessionInput = screen.getByLabelText("dialog.session.label");
        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.clear(sessionInput);
        await user.click(submitButton);

        expect(await screen.findByText("missingFields")).toBeInTheDocument();
        expect(mockSessionApiClient.createSession).not.toHaveBeenCalled();
    });

    it("shows a validation error for invalid session format", async () => {
        const user = userEvent.setup();
        renderModal();

        const sessionInput = screen.getByLabelText("dialog.session.label");

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        await user.clear(sessionInput);
        await user.type(sessionInput, "abcd/efgh");

        await user.type(startInput, "2024-08-01");
        await user.type(endInput, "2024-12-15");

        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("validation.invalidSessionFormat"),
        ).toBeInTheDocument();

        expect(mockSessionApiClient.createSession).not.toHaveBeenCalled();
    });

    it("shows a validation error if session year range is invalid", async () => {
        const user = userEvent.setup();
        renderModal();

        const sessionInput = screen.getByLabelText("dialog.session.label");

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        await user.clear(sessionInput);
        await user.type(sessionInput, "2024/2029");

        await user.type(startInput, "2024-08-01");
        await user.type(endInput, "2024-12-15");

        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("validation.invalidSessionRange"),
        ).toBeInTheDocument();

        expect(mockSessionApiClient.createSession).not.toHaveBeenCalled();
    });

    it("shows a validation error is end date is before start date", async () => {
        const user = userEvent.setup();
        renderModal();

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        await user.type(startInput, "2024-08-01");
        await user.type(endInput, "2024-07-01");

        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.click(submitButton);

        expect(await screen.findByText("invalidDateRange")).toBeInTheDocument();
        expect(mockSessionApiClient.createSession).not.toHaveBeenCalled();
    });

    it("submits the form successfully and triggers callbacks", async () => {
        const user = userEvent.setup();
        mockSessionApiClient.createSession.mockResolvedValueOnce(undefined);

        const { onClose, onSuccess } = renderModal();

        const sessionInput = screen.getByLabelText("dialog.session.label");

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        const activeSwitch = screen.getByRole("checkbox");

        await user.clear(sessionInput);
        await user.type(sessionInput, "2025/2026");

        await user.selectOptions(
            screen.getByRole("combobox", { name: "dialog.semester.label" }),
            "2",
        );

        await user.type(startInput, "2025-01-10");
        await user.type(endInput, "2025-06-20");

        await user.click(activeSwitch.closest("label")!);

        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.click(submitButton);

        const startTimestamp = new Date("2025-01-10").getTime();
        const endTimestamp = new Date("2025-06-20").getTime();

        await waitFor(() => {
            expect(mockSessionApiClient.createSession).toHaveBeenCalledWith(
                "2025/2026",
                2,
                startTimestamp,
                endTimestamp,
                true,
            );
        });

        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("handles API errors gracefully and shows an error toast", async () => {
        const user = userEvent.setup();

        mockSessionApiClient.createSession.mockRejectedValueOnce(
            new APIError(400, "Session already exists"),
        );

        const { onClose, onSuccess } = renderModal();

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        await user.type(startInput, "2025-01-10");
        await user.type(endInput, "2025-06-20");

        const submitButton = screen.getByRole("button", {
            name: "dialog.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("Session already exists"),
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

        const sessionInput = screen.getByLabelText("dialog.session.label");

        const startInput = screen.getByLabelText("dialog.startDate.label");
        const endInput = screen.getByLabelText("dialog.endDate.label");

        const roleSelect = screen.getByRole("combobox");

        await user.clear(sessionInput);
        await user.type(sessionInput, "2026/2027");
        await user.type(startInput, "2026-08-01");
        await user.type(endInput, "2026-12-15");
        await user.selectOptions(roleSelect, "2");

        await user.click(
            screen.getByRole("button", { name: "dialog.cancelButton" }),
        );

        expect(onClose).toHaveBeenCalled();

        expect(sessionInput).toHaveValue(defaultSession);
        expect(startInput).toHaveValue("");
        expect(endInput).toHaveValue("");
        expect(roleSelect).toHaveValue("1");
    });
});
