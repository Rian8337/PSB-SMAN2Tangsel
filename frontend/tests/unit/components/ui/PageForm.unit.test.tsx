import { PageForm, PageFormProps } from "@/components/ui/PageForm";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { mockNotificationApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

function render(props: Partial<PageFormProps> = {}) {
    const onSubmit =
        props.onSubmit ??
        vi.fn<PageFormProps["onSubmit"]>((e) => {
            e.preventDefault();
        });

    const result = renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <PageForm
                {...props}
                title={props.title ?? "Test Form"}
                submitLabel={props.submitLabel ?? "Submit"}
                onSubmit={onSubmit}
            />
            ,
        </NotificationApiProvider>,
    );

    return { ...result, onSubmit };
}

describe("PageForm (unit)", () => {
    it("should render title, children, and submit button", () => {
        render({
            children: <div data-testid="child-element">Form Content</div>,
        });

        expect(
            screen.getByRole("heading", { name: "Test Form" }),
        ).toBeInTheDocument();

        expect(screen.getByTestId("child-element")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Submit" }),
        ).toBeInTheDocument();
    });

    it("should call onSubmit when the form is submitted", async () => {
        const user = userEvent.setup();

        const { onSubmit } = render({
            children: <input type="text" name="test" />,
        });

        const submitButton = screen.getByRole("button", { name: "Submit" });
        await user.click(submitButton);

        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("should display an error message when the error prop is provided", () => {
        render({
            error: "Invalid credentials",
            children: <div />,
        });

        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    it("should disable the submit button when isLoading is true", () => {
        render({
            isLoading: true,
            children: <div />,
        });

        // Chakra UI removes the accessible name during the loading state,
        // so we find the submit button by its HTML type attribute instead.
        const buttons = screen.getAllByRole("button");

        const submitButton = buttons.find(
            (btn) => btn.getAttribute("type") === "submit",
        );

        expect(submitButton).toBeDisabled();
    });
});
