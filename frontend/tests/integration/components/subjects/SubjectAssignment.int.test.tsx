import { SubjectAssignment } from "@/components/subjects/SubjectAssignment";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import {
    mockRouter,
    mockSubjectAssignmentApiClient,
    mockSubjectAssignmentSubmissionApiClient,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
        { id: 1, name: "instructions.pdf", downloadCount: 0 },
        { id: 2, name: "rubric.pdf", downloadCount: 0 },
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
    attachments: [
        { id: 1, name: "instructions.pdf", downloadCount: 3 },
        { id: 2, name: "rubric.pdf", downloadCount: 7 },
    ],
};

function render(role: UserRole) {
    return renderWithChakraProvider(
        <SubjectAssignment assignmentId={1} classSubjectId={10} role={role} />,
    );
}

describe("SubjectAssignment (integration)", () => {
    beforeEach(() => {
        mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue(
            mockStudentAssignment,
        );
    });

    it("should call getAssignment with the correct assignmentId on mount", () => {
        render(UserRole.Student);

        expect(
            mockSubjectAssignmentApiClient.getAssignment,
        ).toHaveBeenCalledWith(1, expect.any(AbortSignal));
    });

    it("should display the subject name as the page heading after loading", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Matematika Wajib" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the assignment title after loading", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Assignment 1" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the assignment description", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(screen.getByText("Submit a report")).toBeInTheDocument();
        });
    });

    it("should display attachment filenames", async () => {
        render(UserRole.Student);

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

        render(UserRole.Student);

        await waitFor(() => {
            expect(screen.getByText("noAttachments")).toBeInTheDocument();
        });
    });

    it("should display dueAt when present", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(screen.getByText(/dueAt/)).toBeInTheDocument();
        });
    });

    describe("as a student", () => {
        it("should show a file upload form when the student has no submission", async () => {
            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByLabelText("addFilesLabel"),
                ).toBeInTheDocument();

                expect(
                    screen.getByRole("button", { name: "submitCreate" }),
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

            render(UserRole.Student);

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

        it("should not show attachment download counts", async () => {
            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByText("instructions.pdf"),
                ).toBeInTheDocument();
            });

            expect(screen.queryByText("downloadCount")).not.toBeInTheDocument();
        });

        it("should not show assignment management buttons", async () => {
            render(UserRole.Student);

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

        it("should show the edit form when edit button is clicked", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
                ...mockStudentAssignment,
                submission: {
                    id: 5,
                    submittedAt: "2026-02-20T10:00:00.000Z",
                    attachments: [{ id: 10, name: "report.pdf" }],
                },
            });

            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "editButton" }),
                ).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "editButton" }),
            );

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "submitEdit" }),
                ).toBeInTheDocument();
            });
        });

        it("should call deleteSubmission and refetch when remove is confirmed", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
                ...mockStudentAssignment,
                submission: {
                    id: 5,
                    submittedAt: "2026-02-20T10:00:00.000Z",
                    attachments: [{ id: 10, name: "report.pdf" }],
                },
            });

            mockSubjectAssignmentSubmissionApiClient.deleteSubmission.mockResolvedValue(
                undefined,
            );

            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "removeButton" }),
                ).toBeInTheDocument();
            });

            vi.spyOn(window, "confirm").mockReturnValue(true);

            await user.click(
                screen.getByRole("button", { name: "removeButton" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentSubmissionApiClient.deleteSubmission,
                ).toHaveBeenCalledWith(1);
            });

            expect(
                mockSubjectAssignmentApiClient.getAssignment,
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe("as a teacher", () => {
        beforeEach(() => {
            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );
        });

        it("should show Edit, Delete, Student submissions, and Hide from students buttons for a visible assignment", async () => {
            render(UserRole.Teacher);

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

        it("should show each attachment's download count", async () => {
            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByText("instructions.pdf"),
                ).toBeInTheDocument();

                expect(screen.getByText("rubric.pdf")).toBeInTheDocument();
            });

            expect(screen.getAllByText("downloadCount")).toHaveLength(
                mockTeacherAssignment.attachments.length,
            );
        });

        it("should show 'showToStudents' for a hidden assignment", async () => {
            mockSubjectAssignmentApiClient.getAssignment.mockResolvedValue({
                ...mockTeacherAssignment,
                visible: false,
            });

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "showToStudents" }),
                ).toBeInTheDocument();
            });
        });

        it("should not show the submission section", async () => {
            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("heading", { name: "Assignment 1" }),
                ).toBeInTheDocument();
            });

            expect(
                screen.queryByRole("button", { name: "submitButton" }),
            ).not.toBeInTheDocument();
        });

        it("should navigate to the edit page when the edit button is clicked", async () => {
            const user = userEvent.setup();

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "editAssignment" }),
                ).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "editAssignment" }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith(
                "/24252/subjects/10/assignments/1/edit",
            );
        });

        it("should call deleteAssignment and redirect when the delete button is confirmed", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.deleteAssignment.mockResolvedValue(
                undefined,
            );

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "deleteAssignment" }),
                ).toBeInTheDocument();
            });

            vi.spyOn(window, "confirm").mockReturnValue(true);

            await user.click(
                screen.getByRole("button", { name: "deleteAssignment" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentApiClient.deleteAssignment,
                ).toHaveBeenCalledWith(1);
            });

            expect(mockRouter.push).toHaveBeenCalledWith("/24252/subjects/10");
        });

        it("should call updateAssignment to toggle visibility when the visibility button is clicked", async () => {
            const user = userEvent.setup();

            mockSubjectAssignmentApiClient.updateAssignment.mockResolvedValue(
                undefined,
            );

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: "hideFromStudents" }),
                ).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "hideFromStudents" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectAssignmentApiClient.updateAssignment,
                ).toHaveBeenCalledWith(1, expect.any(FormData));
            });
        });
    });

    it("should display an error toast and redirect if the API call fails", async () => {
        mockSubjectAssignmentApiClient.getAssignment.mockRejectedValue(
            new Error("Network error"),
        );

        render(UserRole.Student);

        await waitFor(() => {
            expect(
                mockSubjectAssignmentApiClient.getAssignment,
            ).toHaveBeenCalled();
        });
    });
});
