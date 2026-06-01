import { SubjectManagement } from "@/components/admin/SubjectManagement";
import { Subject } from "@psb/shared/types";
import { mockSubjectApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSubjects: Subject[] = [
    {
        id: 1,
        code: "MTK101",
        name: "Matematika",
        active: true,
    },
    {
        id: 2,
        code: "FIS101",
        name: "Fisika",
        active: false,
    },
];

function render() {
    return renderWithChakraProvider(<SubjectManagement />);
}

describe("SubjectManagement (integration)", () => {
    beforeEach(() => {
        // Auto-accept window.confirm for deletion tests.
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should fetch and display subjects on mount", async () => {
        mockSubjectApiClient.listSubjects.mockResolvedValue(mockSubjects);

        render();

        expect(mockSubjectApiClient.listSubjects).toHaveBeenCalledWith(
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByText("Matematika")).toBeInTheDocument();
            expect(screen.getByText("Fisika")).toBeInTheDocument();
        });

        // Assert that the active status is rendered correctly.
        const activeRow = screen.getByText("Matematika").closest("tr")!;
        const inactiveRow = screen.getByText("Fisika").closest("tr")!;

        expect(
            within(activeRow).getByLabelText("active-badge-MTK101"),
        ).toBeInTheDocument();

        expect(
            within(inactiveRow).queryByLabelText("active-badge-FIS101"),
        ).not.toBeInTheDocument();
    });

    it("should display empty state if no subjects are found", async () => {
        mockSubjectApiClient.listSubjects.mockResolvedValue([]);

        render();

        expect(mockSubjectApiClient.listSubjects).toHaveBeenCalledWith(
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing", async () => {
        const user = userEvent.setup();
        mockSubjectApiClient.listSubjects.mockResolvedValue([]);

        render();

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "Matematika");

        await waitFor(() => {
            expect(mockSubjectApiClient.listSubjects).toHaveBeenCalledWith(
                "Matematika",
                10,
                0,
                expect.any(AbortSignal),
            );
        });
    });

    it("should prompt confirmation and delete a subject when trash icon is clicked", async () => {
        const user = userEvent.setup();

        mockSubjectApiClient.listSubjects.mockResolvedValueOnce(mockSubjects);
        mockSubjectApiClient.deleteSubject.mockResolvedValue(undefined);

        // After deletion, only the second subject is returned.
        mockSubjectApiClient.listSubjects.mockResolvedValueOnce([
            mockSubjects[1],
        ]);

        render();

        await waitFor(() => {
            expect(screen.getByText("Matematika")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", {
            name: "delete-MTK101",
        });

        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockSubjectApiClient.deleteSubject).toHaveBeenCalledWith(1);
        });
    });
});
