import { SessionSwitcher } from "@/components/layout/SessionSwitcher";
import { AdminSessionProvider } from "@/providers/AdminSessionContext";
import { AcademicSessionDTO, UserSessionDTO } from "@psb/shared/types";
import {
    mockAuthApiClient,
    mockRouter,
    mockSessionApiClient,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Default usePathname mock returns "/24252/dashboard", so the active session code is "24252" = 2024/2025, semester 2.
const userSessions: UserSessionDTO[] = [
    { session: "2024/2025", semester: 2 },
    { session: "2024/2025", semester: 1 },
];

const adminSessions: AcademicSessionDTO[] = [
    {
        session: "2024/2025",
        semester: 2,
        startTime: new Date(2025, 0, 1).getTime(),
        endTime: new Date(2025, 5, 30).getTime(),
        active: true,
    },
    {
        session: "2024/2025",
        semester: 1,
        startTime: new Date(2024, 6, 1).getTime(),
        endTime: new Date(2024, 11, 31).getTime(),
        active: false,
    },
];

function renderAsUser() {
    return renderWithChakraProvider(<SessionSwitcher />);
}

function renderAsAdmin() {
    return renderWithChakraProvider(
        <AdminSessionProvider>
            <SessionSwitcher />
        </AdminSessionProvider>,
    );
}

describe("SessionSwitcher (integration)", () => {
    describe("as a regular user", () => {
        it("renders nothing when the user has no sessions", async () => {
            mockAuthApiClient.getMySessions.mockResolvedValue([]);

            renderAsUser();

            await waitFor(() => {
                expect(mockAuthApiClient.getMySessions).toHaveBeenCalledOnce();
            });

            expect(
                screen.queryByRole("button", { name: "label" }),
            ).not.toBeInTheDocument();
        });

        it("renders the abbreviated current session in the trigger button", async () => {
            mockAuthApiClient.getMySessions.mockResolvedValue(userSessions);

            renderAsUser();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });

            expect(trigger).toHaveTextContent("24/25 · S2");
        });

        it("shows all available sessions when the menu is opened", async () => {
            const user = userEvent.setup();
            mockAuthApiClient.getMySessions.mockResolvedValue(userSessions);

            renderAsUser();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });
            await user.click(trigger);

            expect(
                await screen.findByRole("menuitem", {
                    name: /2024\/2025 - semester 2/,
                }),
            ).toBeInTheDocument();

            expect(
                screen.getByRole("menuitem", {
                    name: /2024\/2025 - semester 1/,
                }),
            ).toBeInTheDocument();
        });

        it("navigates to the selected session when a different session is clicked", async () => {
            const user = userEvent.setup();
            mockAuthApiClient.getMySessions.mockResolvedValue(userSessions);

            renderAsUser();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });
            await user.click(trigger);

            const s1Item = await screen.findByRole("menuitem", {
                name: /semester 1/,
            });
            await user.click(s1Item);

            expect(mockRouter.push).toHaveBeenCalledWith("/24251/dashboard");
        });

        it("does not navigate when the current session is clicked", async () => {
            const user = userEvent.setup();
            mockAuthApiClient.getMySessions.mockResolvedValue(userSessions);

            renderAsUser();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });
            await user.click(trigger);

            const currentItem = await screen.findByRole("menuitem", {
                name: /semester 2/,
            });
            await user.click(currentItem);

            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });

    describe("as an admin", () => {
        beforeEach(() => {
            mockSessionApiClient.getActive.mockResolvedValue(adminSessions[0]);
        });

        it("renders nothing when there are no sessions", async () => {
            mockSessionApiClient.listSessions.mockResolvedValue([]);

            renderAsAdmin();

            await waitFor(() => {
                expect(
                    mockSessionApiClient.listSessions,
                ).toHaveBeenCalledOnce();
            });

            expect(
                screen.queryByRole("button", { name: "label" }),
            ).not.toBeInTheDocument();
        });

        it("fetches sessions via listSessions, not getMySessions", async () => {
            mockSessionApiClient.listSessions.mockResolvedValue(adminSessions);

            renderAsAdmin();

            await waitFor(() => {
                expect(
                    mockSessionApiClient.listSessions,
                ).toHaveBeenCalledOnce();
            });

            expect(mockAuthApiClient.getMySessions).not.toHaveBeenCalled();
        });

        it("renders the abbreviated selected session in the trigger button", async () => {
            mockSessionApiClient.listSessions.mockResolvedValue(adminSessions);

            renderAsAdmin();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });

            // getActive returns adminSessions[0] = 2024/2025 S2 --> "24/25 · S2"
            expect(trigger).toHaveTextContent("24/25 · S2");
        });

        it("updates the selected session without navigating when a session is clicked", async () => {
            const user = userEvent.setup();
            mockSessionApiClient.listSessions.mockResolvedValue(adminSessions);

            renderAsAdmin();

            const trigger = await screen.findByRole("button", {
                name: "label",
            });
            await user.click(trigger);

            const s1Item = await screen.findByRole("menuitem", {
                name: /semester 1/,
            });
            await user.click(s1Item);

            expect(mockRouter.push).not.toHaveBeenCalled();

            // The trigger button should now show the newly selected session.
            await waitFor(() => {
                expect(trigger).toHaveTextContent("24/25 · S1");
            });
        });
    });
});
