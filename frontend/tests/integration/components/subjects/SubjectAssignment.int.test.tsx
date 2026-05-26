import { SubjectAssignment } from "@/components/subjects/SubjectAssignment";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { SubjectAssignmentApiProvider } from "@/providers/api/subject-assignment-api-provider";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import {
    mockNotificationApiClient,
    mockSubjectAssignmentApiClient,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";

const mockStudentAssignment: StudentSubjectAssignment = {
    id: 1,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    title: "Assignment 1",
    description: "Submit a report",
    dueAt: "2026-02-21T18:00:00.000Z",
    createdAt: "2024-01-15T00:00:00.000Z",
    lastUpdatedAt: "2024-01-23T00:00:00.000Z",
    attachments: [
        { id: 1, name: "instructions.pdf" },
        { id: 2, name: "rubric.pdf" },
    ],
    submission: null,
};

const mockTeacherAssignment: TeacherSubjectAssignment = {
    id: 1,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    title: "Assignment 1",
    description: "Submit a report",
    dueAt: null,
    visible: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    lastUpdatedAt: "2024-01-23T00:00:00.000Z",
    attachments: [],
};

function render(role: UserRole) {
    return renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <SubjectAssignmentApiProvider
                client={mockSubjectAssignmentApiClient}
            >
                <SubjectAssignment
                    assignmentId={1}
                    classSubjectId={10}
                    role={role}
                />
            </SubjectAssignmentApiProvider>
        </NotificationApiProvider>,
    );
}

describe("SubjectAssignment (integration)", () => {
    beforeEach(() => {
        mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue(
            mockStudentAssignment,
        );
    });

    it("should call getAssignment with the correct assignmentId on mount", () => {
        render(UserRole.student);

        expect(
            mockSubjectAssignmentApiClient.getAssignment,
        ).toHaveBeenCalledWith(1, expect.any(AbortSignal));
    });

    it("should display the subject name as the page heading after loading", async () => {
        render(UserRole.student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Matematika Wajib" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the assignment title after loading", async () => {
        render(UserRole.student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Assignment 1" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the assignment description", async () => {
        render(UserRole.student);

        await waitFor(() => {
            expect(screen.getByText("Submit a report")).toBeInTheDocument();
        });
    });

    it("should display attachment filenames", async () => {
        render(UserRole.student);

        await waitFor(() => {
            expect(screen.getByText("instructions.pdf")).toBeInTheDocument();
            expect(screen.getByText("rubric.pdf")).toBeInTheDocument();
        });
    });

    it("should show 'noAttachments' when there are no attachments", async () => {
        mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
            ...mockStudentAssignment,
            attachments: [],
        });

        render(UserRole.student);

        await waitFor(() => {
            expect(screen.getByText("noAttachments")).toBeInTheDocument();
        });
    });

    it("should display dueAt when present", async () => {
        render(UserRole.student);

        await waitFor(() => {
            expect(screen.getByText(/dueAt/)).toBeInTheDocument();
        });
    });

    describe("as a student", () => {
        it("should show a file upload form when the student has no submission", async () => {
            render(UserRole.student);

            await waitFor(() => {
                expect(
                    screen.getByLabelText("uploadLabel"),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "submitButton" }),
                ).toBeInTheDocument();
            });
        });

        it("should show submitted attachments, submittedAt and edit/remove buttons when a submission exists", async () => {
            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
                ...mockStudentAssignment,
                submission: {
                    id: 5,
                    submittedAt: "2026-02-20T10:00:00.000Z",
                    attachments: [{ id: 10, name: "report.pdf" }],
                },
            });

            render(UserRole.student);

            await waitFor(() => {
                expect(screen.getByText("report.pdf")).toBeInTheDocument();
                expect(screen.getByText(/submittedAt/)).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "editButton" }),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "removeButton" }),
                ).toBeInTheDocument();
            });
        });

        it("should not show assignment management buttons", async () => {
            render(UserRole.student);

            await waitFor(() => {
                expect(
                    screen.getByRole("heading", { name: "Assignment 1" }),
                ).toBeInTheDocument();
            });

            expect(
                screen.queryByRole("button", { name: "editAssignment" }),
            ).not.toBeInTheDocument();

            expect(
                screen.queryByRole("button", { name: "deleteAssignment" }),
            ).not.toBeInTheDocument();
        });
    });

    describe("as a teacher", () => {
        beforeEach(() => {
            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );
        });

        it("should show Edit, Delete, Student submissions, and Hide from students buttons for a visible assignment", async () => {
            render(UserRole.teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "editAssignment" }),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "deleteAssignment" }),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "studentSubmissions" }),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "hideFromStudents" }),
                ).toBeInTheDocument();
            });
        });

        it("should show 'showToStudents' for a hidden assignment", async () => {
            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
                ...mockTeacherAssignment,
                visible: false,
            });

            render(UserRole.teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "showToStudents" }),
                ).toBeInTheDocument();
            });
        });

        it("should not show the submission section", async () => {
            render(UserRole.teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("heading", { name: "Assignment 1" }),
                ).toBeInTheDocument();
            });

            expect(
                screen.queryByRole("button", { name: "submitButton" }),
            ).not.toBeInTheDocument();
        });
    });

    it("should display an error toast and redirect if the API call fails", async () => {
        mockSubjectAssignmentApiClient.getAssignment.mockRejectedValue(
            new Error("Network error"),
        );

        render(UserRole.student);

        await waitFor(() => {
            expect(
                mockSubjectAssignmentApiClient.getAssignment,
            ).toHaveBeenCalled();
        });
    });
});
