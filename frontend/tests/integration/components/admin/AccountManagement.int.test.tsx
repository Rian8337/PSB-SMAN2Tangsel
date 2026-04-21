import {
    AccountManagement,
    AccountManagementProps,
} from "@/components/admin/AccountManagement";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { UserApiProvider } from "@/providers/api/user-api-provider";
import { UserListItem, UserRole } from "@psb/shared/types";
import { mockNotificationApiClient, mockUserApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const currentUserId = 1;

const mockUsers: UserListItem[] = [
    {
        id: currentUserId,
        name: "Admin User",
        identifier: "ADMIN-01",
        role: UserRole.administrator,
        active: true,
    },
    {
        id: 2,
        name: "Budi Teacher",
        identifier: "NIP-123",
        role: UserRole.teacher,
        active: true,
    },
    {
        id: 3,
        name: "Siti Student",
        identifier: "NISN-456",
        role: UserRole.student,
        active: false,
    },
];

function render(props: Partial<AccountManagementProps> = {}) {
    return renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <UserApiProvider client={mockUserApiClient}>
                <AccountManagement
                    currentUserId={props.currentUserId ?? currentUserId}
                />
            </UserApiProvider>
        </NotificationApiProvider>,
    );
}

describe("AccountManagement (integration)", () => {
    beforeEach(() => {
        // Auto-accept window.confirm for deletion tests.
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should fetch and display users on mount", async () => {
        mockUserApiClient.listUsers.mockResolvedValue(mockUsers);

        render();

        expect(mockUserApiClient.listUsers).toHaveBeenCalledWith(
            undefined,
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        // Wait for the grid to populate.
        await waitFor(() => {
            expect(screen.getByText("Admin User")).toBeInTheDocument();
            expect(screen.getByText("Budi Teacher")).toBeInTheDocument();
            expect(screen.getByText("NISN-456")).toBeInTheDocument();
        });
    });

    it("should display the empty state if no users are found", async () => {
        mockUserApiClient.listUsers.mockResolvedValue([]);

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing in the search bar", async () => {
        const user = userEvent.setup();
        mockUserApiClient.listUsers.mockResolvedValue([]);

        render();

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "Budi");

        // Wait for the debounce timeout and API call.
        await waitFor(() => {
            expect(mockUserApiClient.listUsers).toHaveBeenCalledWith(
                undefined,
                "Budi",
                10,
                0,
                expect.any(AbortSignal),
            );
        });
    });

    it("should prompt confirmation and delete a user when trash icon is clicked", async () => {
        const user = userEvent.setup();

        // Sequential returns: initial load -> delete -> reload
        mockUserApiClient.listUsers.mockResolvedValueOnce(mockUsers);
        mockUserApiClient.deleteUser.mockResolvedValue(undefined);

        // After deletion, only the first user is returned, since the second user was "deleted" and the third user is inactive.
        mockUserApiClient.listUsers.mockResolvedValueOnce([mockUsers[0]]);

        render();

        // Wait for the grid to render the target user.
        await waitFor(() => {
            expect(screen.getByText("Budi Teacher")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", {
            name: "delete-NIP-123",
        });

        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockUserApiClient.deleteUser).toHaveBeenCalledWith(2);
        });
    });

    it("should NOT render a delete button for the currently logged-in user", async () => {
        mockUserApiClient.listUsers.mockResolvedValue(mockUsers);

        render();

        // Wait for the grid to populate.
        await waitFor(() => {
            expect(screen.getByText("Admin User")).toBeInTheDocument();
        });

        const deleteBtn = screen.queryByRole("button", {
            name: "delete-ADMIN-01",
        });

        expect(deleteBtn).not.toBeInTheDocument();

        // Other users should still have their delete buttons.
        expect(
            screen.getByRole("button", { name: "delete-NIP-123" }),
        ).toBeInTheDocument();
    });
});
