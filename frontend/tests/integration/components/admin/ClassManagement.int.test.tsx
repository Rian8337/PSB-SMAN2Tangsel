import { APIError } from "@/api";
import { ClassManagement } from "@/components/admin/ClassManagement";
import { AdminSessionProvider } from "@/providers/AdminSessionContext";
import { AcademicSessionDTO, Class } from "@psb/shared/types";
import {
    mockClassApiClient,
    mockSessionApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockActiveSession: AcademicSessionDTO = {
    session: "2024/2025",
    semester: 1,
    startTime: new Date(2024, 6, 1).getTime(),
    endTime: new Date(2024, 11, 31).getTime(),
    active: true,
};

const mockSecondSession: AcademicSessionDTO = {
    session: "2023/2024",
    semester: 2,
    startTime: new Date(2024, 0, 1).getTime(),
    endTime: new Date(2024, 5, 30).getTime(),
    active: false,
};

const mockClasses: Class[] = [
    {
        id: 1,
        name: "X IPA 1",
        session: "2024/2025",
        semester: 1,
    },
    {
        id: 2,
        name: "X IPS 1",
        session: "2024/2025",
        semester: 1,
    },
];

function render() {
    return renderWithChakraProvider(
        <AdminSessionProvider>
            <ClassManagement />
        </AdminSessionProvider>,
    );
}

describe("ClassManagement (integration)", () => {
    beforeEach(() => {
        // Auto-accept window.confirm for deletion tests.
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should display a fallback message if there is no active session", async () => {
        mockSessionApiClient.getActive.mockRejectedValue(
            new APIError(404, "No active session"),
        );

        render();

        await waitFor(() => {
            expect(screen.getByText("noActiveSession")).toBeInTheDocument();
        });

        expect(mockClassApiClient.listClasses).not.toHaveBeenCalled();
        expect(mockToaster.create).not.toHaveBeenCalled();
    });

    it("should display a fallback message with toast if active session fetch fails with an unexpected error", async () => {
        mockSessionApiClient.getActive.mockRejectedValue(
            new APIError(500, "Internal Server Error"),
        );

        render();

        expect(mockClassApiClient.listClasses).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "error",
                }),
            );
        });
    });

    it("should fetch the active session and then display the classes", async () => {
        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockClassApiClient.listClasses.mockResolvedValue(mockClasses);

        render();

        await waitFor(() => {
            expect(mockSessionApiClient.getActive).toHaveBeenCalledOnce();

            expect(mockClassApiClient.listClasses).toHaveBeenCalledWith({
                session: mockActiveSession.session,
                semester: mockActiveSession.semester,
                query: "",
                limit: 10,
                offset: 0,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                signal: expect.any(AbortSignal),
            });
        });

        // Verify the grid populated.
        expect(await screen.findByText("X IPA 1")).toBeInTheDocument();
        expect(screen.getByText("X IPS 1")).toBeInTheDocument();
    });

    it("should display the empty state if no classes are found for the active session", async () => {
        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockClassApiClient.listClasses.mockResolvedValue([]);

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing in the search bar", async () => {
        const user = userEvent.setup();

        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockClassApiClient.listClasses.mockResolvedValue([]);

        render();

        // Wait for initial load to finish before interacting.
        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledTimes(1);
        });

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "IPA");

        // Wait for the debounce timeout and the subsequent API call.
        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledWith(
                expect.objectContaining({
                    query: "IPA",
                }),
            );
        });
    });

    it("should not render the active session label", async () => {
        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockClassApiClient.listClasses.mockResolvedValue(mockClasses);

        render();

        await waitFor(() => {
            expect(screen.getByText("X IPA 1")).toBeInTheDocument();
        });

        expect(
            screen.queryByText("activeSessionLabel"),
        ).not.toBeInTheDocument();
    });

    it("should reset page and search when the session is switched via the session switcher", async () => {
        const user = userEvent.setup();

        // 10 classes to fill the page limit and enable the "next page" button.
        const tenClasses: Class[] = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `X IPA ${(i + 1).toString()}`,
            session: mockActiveSession.session,
            semester: mockActiveSession.semester,
        }));

        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockSessionApiClient.listSessions.mockResolvedValue([
            mockActiveSession,
            mockSecondSession,
        ]);
        mockClassApiClient.listClasses.mockResolvedValue(tenClasses);

        render();

        // Wait for initial load to finish (the next button is disabled while loading).
        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledTimes(1);
            expect(
                screen.getByRole("button", { name: "next" }),
            ).not.toBeDisabled();
        });

        // Advance to page 2.
        const nextBtn = screen.getByRole("button", { name: "next" });
        await user.click(nextBtn);

        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledWith(
                expect.objectContaining({ offset: 10 }),
            );
        });

        // Type a search query.
        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "IPA");

        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledWith(
                expect.objectContaining({ query: "IPA" }),
            );
        });

        // Switch to the second session via SessionSwitcher.
        mockClassApiClient.listClasses.mockResolvedValue([]);

        const switcherTrigger = screen.getByRole("button", { name: "label" });
        await user.click(switcherTrigger);

        const sessionMenuItem = await screen.findByRole("menuitem", {
            name: /2023\/2024/,
        });
        await user.click(sessionMenuItem);

        // After switching, both the page (offset) and search query must be reset.
        await waitFor(() => {
            expect(mockClassApiClient.listClasses).toHaveBeenCalledWith(
                expect.objectContaining({
                    session: mockSecondSession.session,
                    semester: mockSecondSession.semester,
                    query: "",
                    offset: 0,
                }),
            );
        });

        expect(searchInput).toHaveValue("");
    });

    it("should prompt confirmation and delete a class when the trash icon is clicked", async () => {
        const user = userEvent.setup();

        mockSessionApiClient.getActive.mockResolvedValue(mockActiveSession);
        mockClassApiClient.listClasses.mockResolvedValueOnce(mockClasses);
        mockClassApiClient.deleteClass.mockResolvedValue(undefined);

        // First class is deleted, so only the second class is returned.
        mockClassApiClient.listClasses.mockResolvedValueOnce([mockClasses[1]]);

        render();

        await waitFor(() => {
            expect(screen.getByText("X IPA 1")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", {
            name: "delete-X IPA 1",
        });

        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockClassApiClient.deleteClass).toHaveBeenCalledWith(1);
        });
    });
});
