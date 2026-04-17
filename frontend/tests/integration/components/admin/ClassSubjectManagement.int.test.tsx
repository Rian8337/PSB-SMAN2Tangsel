import { ClassSubjectManagement } from "@/components/admin/ClassSubjectManagement";
import { ClassSubjectApiProvider } from "@/providers/api/class-subject-api-provider";
import { UserApiProvider } from "@/providers/api/user-api-provider";
import { Class, ClassSubjectAssignment, UserRole } from "@psb/shared/types";
import { mockClassSubjectApiClient, mockUserApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";

const mockClass: Class = {
    id: 1,
    name: "X IPA 1",
    session: "2024/2025",
    semester: 1,
};

const mockAssignments: ClassSubjectAssignment[] = [
    {
        id: 10,
        subject: { id: 101, code: "MTK1", name: "Matematika" },
        teacher: { id: 5, name: "Budi Santoso" },
    },
    {
        id: 11,
        subject: { id: 102, code: "FIS1", name: "Fisika" },
        teacher: null,
    },
];

function render() {
    return renderWithChakraProvider(
        <NextIntlClientProvider locale="id">
            <UserApiProvider client={mockUserApiClient}>
                <ClassSubjectApiProvider client={mockClassSubjectApiClient}>
                    <ClassSubjectManagement clazz={mockClass} />
                </ClassSubjectApiProvider>
            </UserApiProvider>
        </NextIntlClientProvider>,
    );
}

describe("ClassSubjectManagement (integration)", () => {
    beforeEach(() => {
        vi.spyOn(window, "confirm").mockImplementation(() => true);
    });

    it("should fetch and render assigned subjects on mount", async () => {
        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValue(
            mockAssignments,
        );

        render();

        expect(
            mockClassSubjectApiClient.listAssignedSubjects,
        ).toHaveBeenCalledWith(
            mockClass.id,
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByText("Matematika")).toBeInTheDocument();
            expect(screen.getByText("Fisika")).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue("Budi Santoso")).toBeInTheDocument();
    });

    it("should allow inline updating of a teacher via the AsyncSelect dropdown", async () => {
        const user = userEvent.setup();

        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValue(
            mockAssignments,
        );
        mockClassSubjectApiClient.updateAssignedSubject.mockResolvedValue(
            undefined,
        );

        mockUserApiClient.listUsers.mockResolvedValue([
            {
                id: 99,
                name: "Siti Guru",
                identifier: "NIP-999",
                role: UserRole.teacher,
                active: true,
            },
        ]);

        render();

        await waitFor(() => {
            expect(screen.getByText("Fisika")).toBeInTheDocument();
        });

        const fisikaRow = screen.getByText("Fisika").closest("tr")!;

        const fisikaInput = within(fisikaRow).getByPlaceholderText(
            "unassignedTeacherPlaceholder",
        );

        await user.click(fisikaInput);
        await user.type(fisikaInput, "Siti");

        const teacherOption = await screen.findByText("Siti Guru");
        await user.click(teacherOption);

        await waitFor(() => {
            expect(
                mockClassSubjectApiClient.updateAssignedSubject,
            ).toHaveBeenCalledWith(mockClass.id, 11, 99);
        });
    });

    it("should prompt confirmation and remove an assignment", async () => {
        const user = userEvent.setup();

        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValueOnce(
            mockAssignments,
        );

        mockClassSubjectApiClient.unassignSubject.mockResolvedValue(undefined);

        // First assignment is removed, so only the second assignment is returned.
        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValueOnce([
            mockAssignments[1],
        ]);

        render();

        await waitFor(() => {
            expect(screen.getByText("Matematika")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", {
            name: "remove-subject-MTK1",
        });
        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(
                mockClassSubjectApiClient.unassignSubject,
            ).toHaveBeenCalledWith(mockClass.id, 10);
        });
    });

    it("should open the Assign modal when the add button is clicked", async () => {
        const user = userEvent.setup();
        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValue([]);

        render();

        const assignBtn = await screen.findByRole("button", {
            name: /assignNewSubject/i,
        });
        await user.click(assignBtn);

        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
    });
});
