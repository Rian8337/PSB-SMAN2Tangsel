import { APIError } from "@/api";
import {
    AssignClassStudentModal,
    AssignClassStudentModalProps,
} from "@/components/admin/AssignClassStudentModal";
import { Class, UserListItem, UserRole } from "@psb/shared/types";
import { mockClassStudentApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const onClose = vi.fn();
const onSuccess = vi.fn();

const mockClass: Class = {
    id: 1,
    name: "X MIPA 1",
    session: "2024/2025",
    semester: 1,
};

const mockStudent: UserListItem = {
    id: 101,
    name: "Budi Santoso",
    identifier: "NISN123",
    role: UserRole.Student,
    active: true,
};

function render(props: Partial<AssignClassStudentModalProps> = {}) {
    return renderWithChakraProvider(
        <AssignClassStudentModal
            isOpen={props.isOpen ?? true}
            clazz={props.clazz ?? mockClass}
            onClose={onClose}
            onSuccess={onSuccess}
            {...props}
        />,
    );
}

describe("AssignClassStudentModal (unit)", () => {
    it("should display a validation error if no student is selected", async () => {
        const user = userEvent.setup();

        render();

        const submitButton = screen.getByRole("button", {
            name: "submitButton",
        });

        await user.click(submitButton);

        expect(
            screen.getByText("validation.selectStudent"),
        ).toBeInTheDocument();

        expect(mockClassStudentApiClient.enrollStudent).not.toHaveBeenCalled();
    });

    it("should fetch and allow selecting a student, then submit successfully", async () => {
        const user = userEvent.setup();

        mockClassStudentApiClient.getUnenrolledStudents.mockResolvedValue([
            mockStudent,
        ]);

        mockClassStudentApiClient.enrollStudent.mockResolvedValue(undefined);

        render();

        const studentInput = screen.getByPlaceholderText(
            "fields.student.placeholder",
        );

        await user.click(studentInput);
        await user.type(studentInput, "Budi");

        const studentOption = await screen.findByText(
            `${mockStudent.identifier} - ${mockStudent.name}`,
        );

        await user.click(studentOption);

        const submitButton = screen.getByRole("button", {
            name: "submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(
                mockClassStudentApiClient.enrollStudent,
            ).toHaveBeenCalledWith(mockClass.id, mockStudent.id);
        });

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("should handle API errors during submission gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Student is already enrolled";

        mockClassStudentApiClient.getUnenrolledStudents.mockResolvedValue([
            mockStudent,
        ]);

        mockClassStudentApiClient.enrollStudent.mockRejectedValue(
            new APIError(409, errorMessage),
        );

        render();

        const studentInput = screen.getByPlaceholderText(
            "fields.student.placeholder",
        );

        await user.click(studentInput);
        await user.type(studentInput, "Budi");

        const studentOption = await screen.findByText(
            `${mockStudent.identifier} - ${mockStudent.name}`,
        );

        await user.click(studentOption);

        const submitButton = screen.getByRole("button", {
            name: "submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
