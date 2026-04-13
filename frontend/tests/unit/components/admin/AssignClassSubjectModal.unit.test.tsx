import { APIError } from "@/api";
import {
    AssignClassSubjectModal,
    AssignClassSubjectModalProps,
} from "@/components/admin/AssignClassSubjectModal";
import { ClassSubjectApiProvider } from "@/providers/api/class-subject-api-provider";
import { UserApiProvider } from "@/providers/api/user-api-provider";
import { Class, Subject, UserListItem, UserRole } from "@psb/shared/types";
import { mockClassSubjectApiClient, mockUserApiClient } from "@test/mocks";
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

const mockSubjects: Subject[] = [
    { id: 1, code: "MA101", name: "Matematika", active: true },
    { id: 2, code: "FI101", name: "Fisika", active: true },
];

const mockTeacher: UserListItem = {
    id: 1,
    name: "Budi Santoso",
    identifier: "1",
    role: UserRole.teacher,
    active: true,
};

function render(props: Partial<AssignClassSubjectModalProps> = {}) {
    return renderWithChakraProvider(
        <ClassSubjectApiProvider client={mockClassSubjectApiClient}>
            <UserApiProvider client={mockUserApiClient}>
                <AssignClassSubjectModal
                    isOpen={props.isOpen ?? true}
                    clazz={props.clazz ?? mockClass}
                    onClose={onClose}
                    onSuccess={onSuccess}
                    {...props}
                />
            </UserApiProvider>
        </ClassSubjectApiProvider>,
    );
}

describe("AssignClassSubjectModal (unit)", () => {
    it("should display a validation error if no subject is selected", async () => {
        const user = userEvent.setup();

        render();

        const submitButton = screen.getByRole("button", {
            name: "assignButton",
        });

        await user.click(submitButton);

        expect(
            screen.getByText("validation.selectSubject"),
        ).toBeInTheDocument();

        expect(mockClassSubjectApiClient.assignSubject).not.toHaveBeenCalled();
    });

    it("should fetch and allow selecting a subject and teacher, then submit successfully", async () => {
        const user = userEvent.setup();

        mockClassSubjectApiClient.listUnassignedSubjects.mockResolvedValue(
            mockSubjects,
        );

        mockUserApiClient.listUsers.mockResolvedValue([mockTeacher]);
        mockClassSubjectApiClient.assignSubject.mockResolvedValue(undefined);

        render();

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.click(subjectInput);

        const subjectOption = await screen.findByText(
            `${mockSubjects[0].code} - ${mockSubjects[0].name}`,
        );

        await user.click(subjectOption);

        const teacherInput = screen.getByPlaceholderText(
            "fields.teacher.placeholder",
        );

        await user.click(teacherInput);

        const teacherOption = await screen.findByText(mockTeacher.name);
        await user.click(teacherOption);

        const submitButton = screen.getByRole("button", {
            name: "assignButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(
                mockClassSubjectApiClient.assignSubject,
            ).toHaveBeenCalledWith(
                mockClass.id,
                mockSubjects[0].id,
                mockTeacher.id,
            );
        });

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("should allow submitting without a teacher (null teacherId)", async () => {
        const user = userEvent.setup();

        mockClassSubjectApiClient.listUnassignedSubjects.mockResolvedValue(
            mockSubjects,
        );

        mockClassSubjectApiClient.assignSubject.mockResolvedValue(undefined);

        render();

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.click(subjectInput);

        const subjectOption = await screen.findByText(
            `${mockSubjects[0].code} - ${mockSubjects[0].name}`,
        );

        await user.click(subjectOption);

        const submitButton = screen.getByRole("button", {
            name: "assignButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(
                mockClassSubjectApiClient.assignSubject,
            ).toHaveBeenCalledWith(mockClass.id, mockSubjects[0].id, null);
        });

        expect(onSuccess).toHaveBeenCalledOnce();
    });

    it("should handle API errors during submission gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Subject already assigned";

        mockClassSubjectApiClient.listUnassignedSubjects.mockResolvedValue(
            mockSubjects,
        );

        mockClassSubjectApiClient.assignSubject.mockRejectedValue(
            new APIError(409, errorMessage),
        );

        render();

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.click(subjectInput);

        const subjectOption = await screen.findByText(
            `${mockSubjects[0].code} - ${mockSubjects[0].name}`,
        );

        await user.click(subjectOption);

        const submitButton = screen.getByRole("button", {
            name: "assignButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
