import { AcademicSessionManagement } from "@/components/admin/AcademicSessionManagement";
import { SessionApiProvider } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { mockSessionApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockSessions: AcademicSessionDTO[] = [
    // Active session, cannot be deleted.
    {
        session: "2023/2024",
        semester: 1,
        startTime: new Date(2023, 6, 1).getTime(),
        endTime: new Date(2023, 11, 31).getTime(),
        active: true,
    },
    // Inactive session, can be deleted.
    {
        session: "2023/2024",
        semester: 2,
        startTime: new Date(2024, 0, 1).getTime(),
        endTime: new Date(2024, 5, 30).getTime(),
        active: false,
    },
];

function render() {
    return renderWithChakraProvider(
        <SessionApiProvider client={mockSessionApiClient}>
            <AcademicSessionManagement />
        </SessionApiProvider>,
    );
}

describe("AcademicSessionManagement (unit)", () => {
    beforeEach(() => {
        // Auto-accept window.confirm for deletion tests.
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should fetch and display academic sessions on mount", async () => {
        mockSessionApiClient.listSessions.mockResolvedValue(mockSessions);

        render();

        expect(mockSessionApiClient.listSessions).toHaveBeenCalledWith(
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            // Because both sessions share the same year string, we use getAllByText.
            const sessionCells = screen.getAllByText("2023/2024");
            expect(sessionCells.length).toBe(2);

            // Verify semester numbers are rendered.
            expect(screen.getByText("1")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    it("should display the empty state if no sessions are found", async () => {
        mockSessionApiClient.listSessions.mockResolvedValue([]);

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing in the search bar", async () => {
        const user = userEvent.setup();
        mockSessionApiClient.listSessions.mockResolvedValue([]);

        render();

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "2025");

        // Wait for the debounce timeout and API call.
        await waitFor(() => {
            expect(mockSessionApiClient.listSessions).toHaveBeenCalledWith(
                "2025",
                10,
                0,
                expect.any(AbortSignal),
            );
        });
    });

    it("should prompt confirmation and delete an inactive session when trash icon is clicked", async () => {
        const user = userEvent.setup();

        // Sequential returns: initial load -> delete -> reload.
        mockSessionApiClient.listSessions.mockResolvedValueOnce(mockSessions);
        mockSessionApiClient.deleteSession.mockResolvedValue(undefined);

        // After deletion, only the active session is returned, since the inactive session was deleted.
        mockSessionApiClient.listSessions.mockResolvedValueOnce([
            mockSessions[0],
        ]);

        render();

        // Wait for the grid to render the inactive session.
        await waitFor(() => {
            expect(screen.getByText("2")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", {
            name: "delete-2023/2024-semester-2",
        });

        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockSessionApiClient.deleteSession).toHaveBeenCalledWith(
                "2023/2024",
                2,
            );
        });
    });

    it("should NOT display a delete button for active sessions", async () => {
        mockSessionApiClient.listSessions.mockResolvedValue([mockSessions[0]]);

        render();

        await waitFor(() => {
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        const deleteBtn = screen.queryByRole("button", {
            name: "delete-2023/2024-semester-1",
        });

        expect(deleteBtn).not.toBeInTheDocument();
    });
});
