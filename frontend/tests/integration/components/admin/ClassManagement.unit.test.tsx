import { APIError } from "@/api";
import { ClassManagement } from "@/components/admin/ClassManagement"; // Adjust path if necessary
import { ClassApiProvider } from "@/providers/api/class-api-provider";
import { SessionApiProvider } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO, Class } from "@psb/shared/types";
import { mockClassApiClient, mockSessionApiClient } from "@test/mocks";
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
        <SessionApiProvider client={mockSessionApiClient}>
            <ClassApiProvider client={mockClassApiClient}>
                <ClassManagement />
            </ClassApiProvider>
        </SessionApiProvider>,
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
        expect(screen.getByText("X IPA 1")).toBeInTheDocument();
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
