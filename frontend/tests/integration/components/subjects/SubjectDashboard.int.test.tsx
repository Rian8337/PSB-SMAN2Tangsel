import { SubjectDashboard } from "@/components/subjects/SubjectDashboard";
import {
    SubjectDashboard as SubjectDashboardData,
    UserRole,
} from "@psb/shared/types";
import { mockRouter, mockSubjectDashboardApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockDashboard: SubjectDashboardData = {
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    class: { id: 1, name: "X-IPA-1", session: "2024/2025", semester: 1 },
    materials: [
        {
            id: 1,
            title: "Introduction to Calculus",
            description: "Week 1",
            visible: true,
        },
        { id: 2, title: "Hidden Material", description: null, visible: false },
    ],
    assignments: [
        { id: 1, title: "Homework 1", visible: true },
        { id: 2, title: "Hidden Assignment", visible: false },
    ],
};

function render(role: UserRole) {
    return renderWithChakraProvider(
        <SubjectDashboard classSubjectId={1} role={role} />,
    );
}

describe("SubjectDashboard (integration)", () => {
    beforeEach(() => {
        mockSubjectDashboardApiClient.getDashboard.mockResolvedValue(
            mockDashboard,
        );
    });

    it("should call getDashboard with the correct classSubjectId on mount", () => {
        render(UserRole.Student);

        expect(mockSubjectDashboardApiClient.getDashboard).toHaveBeenCalledWith(
            1,
            expect.any(AbortSignal),
        );
    });

    it("should display the subject name as the page title after loading", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Matematika Wajib" }),
            ).toBeInTheDocument();
        });
    });

    describe("as a student", () => {
        it("should display all materials (visibility filtered server-side)", async () => {
            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByText("Introduction to Calculus"),
                ).toBeInTheDocument();
                expect(screen.getByText("Hidden Material")).toBeInTheDocument();
            });
        });

        it("should not show 'Add' buttons", async () => {
            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByText("Introduction to Calculus"),
                ).toBeInTheDocument();
            });

            expect(screen.queryByText("addMaterial")).not.toBeInTheDocument();
            expect(screen.queryByText("addAssignment")).not.toBeInTheDocument();
        });
    });

    describe("as a teacher", () => {
        it("should display all materials including hidden ones", async () => {
            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByText("Introduction to Calculus"),
                ).toBeInTheDocument();
                expect(screen.getByText("Hidden Material")).toBeInTheDocument();
            });
        });

        it("should show 'Add' buttons for materials and assignments", async () => {
            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByText("Introduction to Calculus"),
                ).toBeInTheDocument();
            });

            expect(screen.getByText("addMaterial")).toBeInTheDocument();
            expect(screen.getByText("addAssignment")).toBeInTheDocument();
        });

        it("should navigate to the create material page when the Add Material button is clicked", async () => {
            const user = userEvent.setup();

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("addMaterial")).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "addMaterial" }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith(
                "/24252/subjects/1/materials/create",
            );
        });

        it("should navigate to the create assignment page when the Add Assignment button is clicked", async () => {
            const user = userEvent.setup();

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("addAssignment")).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "addAssignment" }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith(
                "/24252/subjects/1/assignments/create",
            );
        });
    });

    it("should display an error toast if the API call fails", async () => {
        mockSubjectDashboardApiClient.getDashboard.mockRejectedValue(
            new Error("Network error"),
        );

        render(UserRole.Student);

        await waitFor(() => {
            expect(
                mockSubjectDashboardApiClient.getDashboard,
            ).toHaveBeenCalled();
        });
    });
});
