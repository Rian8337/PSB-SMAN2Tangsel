import {
    ClassStudentManagement,
    ClassStudentManagementProps,
} from "@/components/admin/ClassStudentManagement";
import { ClassStudentApiProvider } from "@/providers/api/class-student-api-provider";
import { Class, UserListItem, UserRole } from "@psb/shared/types";
import { mockClassStudentApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockClass: Class = {
    id: 1,
    name: "X MIPA 1",
    session: "2024/2025",
    semester: 1,
};

const mockStudents: UserListItem[] = [
    {
        id: 101,
        name: "Budi Santoso",
        identifier: "NISN123",
        role: UserRole.student,
        active: true,
    },
];

function render(props: Partial<ClassStudentManagementProps> = {}) {
    return renderWithChakraProvider(
        <ClassStudentApiProvider client={mockClassStudentApiClient}>
            <ClassStudentManagement
                clazz={props.clazz ?? mockClass}
                {...props}
            />
        </ClassStudentApiProvider>,
    );
}

describe("ClassStudentManagement (integration)", () => {
    beforeEach(() => {
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should fetch and display enrolled students on mount", async () => {
        mockClassStudentApiClient.getEnrolledStudents.mockResolvedValue(
            mockStudents,
        );

        render();

        expect(
            mockClassStudentApiClient.getEnrolledStudents,
        ).toHaveBeenCalledWith(1, "", 10, 0, expect.any(AbortSignal));

        await waitFor(() => {
            expect(screen.getByText(mockStudents[0].name)).toBeInTheDocument();

            expect(
                screen.getByText(mockStudents[0].identifier),
            ).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing", async () => {
        const user = userEvent.setup();
        mockClassStudentApiClient.getEnrolledStudents.mockResolvedValue([]);

        render();

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "Budi");

        await waitFor(() => {
            expect(
                mockClassStudentApiClient.getEnrolledStudents,
            ).toHaveBeenCalledWith(1, "Budi", 10, 0, expect.any(AbortSignal));
        });
    });

    it("should prompt confirmation and unenroll student when remove is clicked", async () => {
        const user = userEvent.setup();

        mockClassStudentApiClient.getEnrolledStudents.mockResolvedValueOnce(
            mockStudents,
        );

        mockClassStudentApiClient.unenrollStudent.mockResolvedValue(undefined);

        // After deletion, no one is enrolled.
        mockClassStudentApiClient.getEnrolledStudents.mockResolvedValueOnce([]);

        render();

        await waitFor(() => {
            expect(screen.getByText(mockStudents[0].name)).toBeInTheDocument();
        });

        const removeBtn = screen.getByRole("button", {
            name: `remove-student-${mockStudents[0].identifier}`,
        });

        await user.click(removeBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(
                mockClassStudentApiClient.unenrollStudent,
            ).toHaveBeenCalledWith(1, mockStudents[0].id);
        });
    });
});
