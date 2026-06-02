import {
    BaseShell,
    BaseShellProps,
    NavItem,
} from "@/components/layout/BaseShell";
import {
    mockAuthApiClient,
    mockNavigation,
    mockRouter,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Circle, Home } from "lucide-react";

const navItems: NavItem[] = [
    { label: "Home", href: "/", icon: Home, exact: true },
    { label: "Dashboard", href: "/dashboard", icon: Circle, exact: false },
];

function renderPage(props: Partial<BaseShellProps> = {}) {
    return renderWithChakraProvider(
        <BaseShell
            navItems={props.navItems ?? navItems}
            mobileTitle={props.mobileTitle ?? "Mobile App Title"}
            settingsHref={props.settingsHref ?? "/settings"}
            userName={props.userName ?? "John Doe"}
            userAvatar={props.userAvatar ?? "https://example.com/avatar.jpg"}
        >
            <div>Page Content</div>
        </BaseShell>,
    );
}

describe("BaseShell (unit)", () => {
    it("renders the sidebar with correct user info and navigation", () => {
        renderPage();

        // JSDOM does not load images, so the avatar will fallback to initials.
        expect(screen.getByText("JD")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /home/i }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /dashboard/i }),
        ).toBeInTheDocument();

        expect(screen.getByText("Page Content")).toBeInTheDocument();
    });

    it("applies the active state to the current route", async () => {
        mockNavigation.usePathname.mockReturnValue("/dashboard");

        renderPage();

        const dashboardButton = await screen.findByRole("button", {
            name: /dashboard/i,
        });

        expect(dashboardButton).toHaveAttribute("aria-current", "page");
    });

    it("opens the language menu and changes the locale", async () => {
        const user = userEvent.setup();

        renderPage();

        const langButton = screen.getByRole("button", {
            name: /change language/i,
        });

        await user.click(langButton);

        const idMenuItem = await screen.findByRole("menuitem", {
            name: /bahasa indonesia/i,
        });

        await user.click(idMenuItem);

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith(
                "/24252/dashboard",
                { locale: "id" },
            );
        });
    });

    it("handles a successful logout flow", async () => {
        const user = userEvent.setup();

        mockAuthApiClient.logout.mockResolvedValueOnce(undefined);

        renderPage();

        const avatarButton = screen.getByText("JD");
        await user.click(avatarButton);

        const logoutItem = await screen.findByText(/logout/i);
        await user.click(logoutItem);

        expect(mockAuthApiClient.logout).toHaveBeenCalledOnce();

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith("/login");
        });
    });

    it("shows an error toast if logout fails", async () => {
        const user = userEvent.setup();

        mockAuthApiClient.logout.mockRejectedValueOnce(
            new Error("Network Error"),
        );

        renderPage();

        const avatarButton = await screen.findByText("JD");
        await user.click(avatarButton);

        const logoutItem = await screen.findByText(/logout/i);
        await user.click(logoutItem);

        expect(mockAuthApiClient.logout).toHaveBeenCalledOnce();
        expect(mockRouter.push).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error" }),
            );
        });
    });
});
