import { FormDialog, FormDialogProps } from "@/components/ui/FormDialog";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

function render(props: Partial<FormDialogProps> = {}) {
    const onClose = props.onClose ?? vi.fn();

    const onSubmit =
        props.onSubmit ??
        vi.fn<FormDialogProps["onSubmit"]>((e) => {
            e.preventDefault();
        });

    const result = renderWithChakraProvider(
        <FormDialog
            {...props}
            isOpen={props.isOpen ?? true}
            formId={props.formId ?? "test-form"}
            title={props.title ?? "Test Form"}
            submitLabel={props.submitLabel ?? "Submit"}
            cancelLabel={props.cancelLabel ?? "Cancel"}
            onClose={onClose}
            onSubmit={onSubmit}
        />,
    );

    return { ...result, onClose, onSubmit };
}

describe("FormDialog (unit)", () => {
    it("should render correctly when isOpen is true", () => {
        render({
            children: <div data-testid="dialog-child">Dialog Content</div>,
        });

        expect(screen.getByText("Test Form")).toBeInTheDocument();
        expect(screen.getByTestId("dialog-child")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Submit" }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Cancel" }),
        ).toBeInTheDocument();
    });

    it("should call onClose when the cancel button is clicked", async () => {
        const user = userEvent.setup();

        const { onClose, onSubmit } = render({ children: <div /> });

        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        await user.click(cancelButton);

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should call onSubmit when the submit button is clicked", async () => {
        const user = userEvent.setup();

        const { onClose, onSubmit } = render({
            children: <input name="test" />,
        });

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await user.click(submitButton);

        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("should lock down the modal when isLoading is true", () => {
        render({ isLoading: true, children: <div /> });

        const cancelButton = screen.getByRole("button", { name: "Cancel" });

        // Chakra UI removes the accessible name during the loading state,
        // so we find the submit button by its HTML type attribute instead.
        const buttons = screen.getAllByRole("button");

        const submitButton = buttons.find(
            (btn) => btn.getAttribute("type") === "submit",
        );

        expect(submitButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
    });

    it("should display the error banner if an error is passed", () => {
        render({ error: "Server timeout", children: <div /> });

        expect(screen.getByText("Server timeout")).toBeInTheDocument();
    });
});
