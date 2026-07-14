import { PageHeader } from "@/components/layout/PageHeader";
import { mockRouter } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { vi } from "vitest";

function render(props: Partial<ComponentProps<typeof PageHeader>> = {}) {
    return renderWithChakraProvider(
        <PageHeader title="Dashboard" {...props} />,
    );
}

vi.mock("@/components/layout/NotificationBell", () => ({
    NotificationBell: () => (
        <div data-testid="mock-notification-bell">Bell</div>
    ),
}));

vi.mock("@/components/layout/SessionSwitcher", () => ({
    SessionSwitcher: () => (
        <div data-testid="mock-session-switcher">Switcher</div>
    ),
}));

describe("PageHeader (unit)", () => {
    it("should render the title and default elements", () => {
        render({ backButtonUrl: "/previous-page" });

        expect(
            screen.getByRole("heading", { level: 2, name: "Dashboard" }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText("go-back")).toBeVisible();

        expect(
            screen.getByTestId("mock-notification-bell"),
        ).toBeInTheDocument();

        expect(screen.getByTestId("mock-session-switcher")).toBeInTheDocument();
    });

    it("should not render the session switcher when showSessionSwitcher is false", () => {
        render({ showSessionSwitcher: false });

        expect(
            screen.queryByTestId("mock-session-switcher"),
        ).not.toBeInTheDocument();

        expect(
            screen.getByTestId("mock-notification-bell"),
        ).toBeInTheDocument();
    });

    it("should visually hide the back button when URL is not provided", () => {
        render();

        const backButton = screen.getByLabelText("go-back");
        expect(backButton).toHaveStyle({ visibility: "hidden" });
    });

    it("should call router.push() when the back button is clicked", async () => {
        const user = userEvent.setup();
        render({ backButtonUrl: "/previous-page" });

        const backButton = screen.getByLabelText("go-back");
        await user.click(backButton);

        expect(mockRouter.push).toHaveBeenCalledOnce();
    });

    it("should render the rightElement if provided", () => {
        render({
            rightElement: <button data-testid="custom-save">Save</button>,
        });

        expect(screen.getByTestId("custom-save")).toBeInTheDocument();
    });
});
