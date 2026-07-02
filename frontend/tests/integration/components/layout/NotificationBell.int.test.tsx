import { NotificationBell } from "@/components/layout/NotificationBell"; // Adjust path
import { NotificationDTO } from "@psb/shared/types";
import { mockNotificationApiClient, mockRouter } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNotifications: NotificationDTO[] = [
    {
        id: 1,
        title: "System Update",
        message: "The system will be down for maintenance at midnight.",
        read: false,
        createdAt: new Date("2026-04-21T10:00:00").getTime(),
        url: null,
    },
    {
        id: 2,
        title: "Schedule Updated",
        message: "Your schedule has been updated.",
        read: true,
        createdAt: new Date("2026-04-20T14:30:00").getTime(),
        url: "/dashboard/schedule",
    },
];

function render() {
    return renderWithChakraProvider(<NotificationBell />);
}

describe("NotificationBell (integration)", () => {
    it("should fetch notifications and display the unread badge on mount", async () => {
        mockNotificationApiClient.getNotifications.mockResolvedValue(
            mockNotifications,
        );

        mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);

        render();

        await waitFor(() => {
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        expect(
            mockNotificationApiClient.getNotifications,
        ).toHaveBeenCalledOnce();

        expect(mockNotificationApiClient.getUnreadCount).toHaveBeenCalledOnce();
    });

    it("should open the popover and display notifications when clicked", async () => {
        const user = userEvent.setup();

        mockNotificationApiClient.getNotifications.mockResolvedValue(
            mockNotifications,
        );

        mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);

        render();

        const bellButton = await screen.findByRole("button", {
            name: "Notifications",
        });
        await user.click(bellButton);

        await waitFor(() => {
            expect(screen.getByText("System Update")).toBeInTheDocument();
            expect(screen.getByText("Schedule Updated")).toBeInTheDocument();
        });
    });

    it("should perform an optimistic UI update when marking a notification as read", async () => {
        const user = userEvent.setup();
        mockNotificationApiClient.getNotifications.mockResolvedValue(
            mockNotifications,
        );
        mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);
        mockNotificationApiClient.updateReadStatus.mockResolvedValue(undefined);

        render();

        const bellButton = await screen.findByRole("button", {
            name: "Notifications",
        });
        await user.click(bellButton);

        const markAsReadBtn = await screen.findByRole("button", {
            name: "markAsRead",
        });

        expect(screen.getByText("1")).toBeInTheDocument();

        await user.click(markAsReadBtn);

        await waitFor(() => {
            expect(screen.queryByText("1")).not.toBeInTheDocument();
        });

        const unreadButtons = screen.getAllByRole("button", {
            name: "markAsUnread",
        });

        expect(unreadButtons).toHaveLength(2);

        expect(mockNotificationApiClient.updateReadStatus).toHaveBeenCalledWith(
            1,
            true,
        );
    });

    it("should navigate to the notification URL when clicked", async () => {
        const user = userEvent.setup();

        mockNotificationApiClient.getNotifications.mockResolvedValue(
            mockNotifications,
        );
        mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);

        render();

        const bellButton = await screen.findByRole("button", {
            name: "Notifications",
        });
        await user.click(bellButton);

        const clickableNotification =
            await screen.findByText("Schedule Updated");

        await user.click(clickableNotification);

        expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/schedule");
    });

    it("should display a relative time for recent notifications", async () => {
        const user = userEvent.setup();
        const now = new Date("2026-04-21T10:30:00").getTime();

        vi.setSystemTime(now);

        try {
            mockNotificationApiClient.getNotifications.mockResolvedValue([
                {
                    ...mockNotifications[0],
                    createdAt: now - 5 * 60 * 1000,
                },
            ]);
            mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);

            render();

            const bellButton = await screen.findByRole("button", {
                name: "Notifications",
            });
            await user.click(bellButton);

            // Locale is mocked to "id" (see tests/mocks/i18n.ts).
            await waitFor(() => {
                expect(
                    screen.getByText("5 menit yang lalu"),
                ).toBeInTheDocument();
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it("should display an absolute date for older notifications", async () => {
        const user = userEvent.setup();

        mockNotificationApiClient.getNotifications.mockResolvedValue(
            mockNotifications,
        );
        mockNotificationApiClient.getUnreadCount.mockResolvedValue(1);

        render();

        const bellButton = await screen.findByRole("button", {
            name: "Notifications",
        });
        await user.click(bellButton);

        await waitFor(() => {
            expect(
                screen.getByText(
                    new Date(
                        mockNotifications[1].createdAt,
                    ).toLocaleDateString("id", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                ),
            ).toBeInTheDocument();
        });
    });

    it("should display the empty state if there are no notifications", async () => {
        const user = userEvent.setup();

        mockNotificationApiClient.getNotifications.mockResolvedValue([]);
        mockNotificationApiClient.getUnreadCount.mockResolvedValue(0);

        render();

        const bellButton = await screen.findByRole("button", {
            name: "Notifications",
        });
        await user.click(bellButton);

        await waitFor(() => {
            expect(screen.getByText("noNotifications")).toBeInTheDocument();
        });
    });
});
