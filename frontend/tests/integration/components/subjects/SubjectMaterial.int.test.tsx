import { SubjectMaterial } from "@/components/subjects/SubjectMaterial";
import {
    SubjectMaterial as SubjectMaterialData,
    UserRole,
} from "@psb/shared/types";
import {
    mockRouter,
    mockSubjectMaterialApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMaterial: SubjectMaterialData = {
    id: 1,
    classSubjectId: 10,
    subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
    title: "Chapter 1",
    description: "Introduction to calculus",
    visible: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    lastUpdatedAt: "2024-01-23T00:00:00.000Z",
    attachments: [
        { id: 1, name: "buku.pdf" },
        { id: 2, name: "slide.pdf" },
    ],
};

function render(role: UserRole) {
    return renderWithChakraProvider(
        <SubjectMaterial materialId={1} classSubjectId={10} role={role} />,
    );
}

describe("SubjectMaterial (integration)", () => {
    beforeEach(() => {
        mockSubjectMaterialApiClient.getMaterial.mockResolvedValue(
            mockMaterial,
        );
    });

    it("should call getMaterial with the correct materialId on mount", () => {
        render(UserRole.Student);

        expect(mockSubjectMaterialApiClient.getMaterial).toHaveBeenCalledWith(
            1,
            expect.any(AbortSignal),
        );
    });

    it("should display the subject name as the page heading after loading", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Matematika Wajib" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the material title after loading", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Chapter 1" }),
            ).toBeInTheDocument();
        });
    });

    it("should display the material description", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(
                screen.getByText("Introduction to calculus"),
            ).toBeInTheDocument();
        });
    });

    it("should display attachment links", async () => {
        render(UserRole.Student);

        await waitFor(() => {
            expect(screen.getByText("buku.pdf")).toBeInTheDocument();
            expect(screen.getByText("slide.pdf")).toBeInTheDocument();
        });
    });

    it("should show 'No attachments' when there are no attachments", async () => {
        mockSubjectMaterialApiClient.getMaterial.mockResolvedValue({
            ...mockMaterial,
            attachments: [],
        });

        render(UserRole.Student);

        await waitFor(() => {
            expect(screen.getByText("noAttachments")).toBeInTheDocument();
        });
    });

    describe("as a student", () => {
        it("should not show Edit/Delete/Toggle buttons", async () => {
            render(UserRole.Student);

            await waitFor(() => {
                expect(
                    screen.getByRole("heading", { name: "Chapter 1" }),
                ).toBeInTheDocument();
            });

            expect(screen.queryByText("editButton")).not.toBeInTheDocument();
            expect(screen.queryByText("deleteButton")).not.toBeInTheDocument();

            expect(
                screen.queryByText("hideFromStudents"),
            ).not.toBeInTheDocument();
        });
    });

    describe("as a teacher", () => {
        it("should show Edit, Delete, and Hide from students buttons for a visible material", async () => {
            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("editButton")).toBeInTheDocument();
                expect(screen.getByText("deleteButton")).toBeInTheDocument();
                expect(
                    screen.getByText("hideFromStudents"),
                ).toBeInTheDocument();
            });
        });

        it("should show 'Show to students' for a hidden material", async () => {
            mockSubjectMaterialApiClient.getMaterial.mockResolvedValue({
                ...mockMaterial,
                visible: false,
            });

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("showToStudents")).toBeInTheDocument();
            });
        });
    });

    it("should display an error toast and redirect if the API call fails", async () => {
        mockSubjectMaterialApiClient.getMaterial.mockRejectedValue(
            new Error("Network error"),
        );

        render(UserRole.Student);

        await waitFor(() => {
            expect(mockSubjectMaterialApiClient.getMaterial).toHaveBeenCalled();
        });
    });

    describe("teacher button actions", () => {
        beforeEach(() => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
        });

        it("should navigate to the edit page when the Edit button is clicked", async () => {
            const user = userEvent.setup();

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("editButton")).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "editButton" }),
            );

            expect(mockRouter.push).toHaveBeenCalledWith(
                "/24252/subjects/10/materials/1/edit",
            );
        });

        it("should call deleteMaterial and navigate back when Delete is confirmed", async () => {
            const user = userEvent.setup();

            mockSubjectMaterialApiClient.deleteMaterial.mockResolvedValue(
                undefined,
            );

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("deleteButton")).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "deleteButton" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectMaterialApiClient.deleteMaterial,
                ).toHaveBeenCalledWith(1);
            });

            expect(mockRouter.push).toHaveBeenCalledWith("/24252/subjects/10");
        });

        it("should call updateMaterial to toggle visibility and refetch", async () => {
            const user = userEvent.setup();

            mockSubjectMaterialApiClient.updateMaterial.mockResolvedValue(
                undefined,
            );

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(
                    screen.getByText("hideFromStudents"),
                ).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "hideFromStudents" }),
            );

            await waitFor(() => {
                expect(
                    mockSubjectMaterialApiClient.updateMaterial,
                ).toHaveBeenCalledWith(1, expect.any(FormData));
            });

            expect(
                mockSubjectMaterialApiClient.getMaterial,
            ).toHaveBeenCalledTimes(2);
        });

        it("should show an error toast when delete fails", async () => {
            const user = userEvent.setup();
            mockSubjectMaterialApiClient.deleteMaterial.mockRejectedValue(
                new Error("Network error"),
            );

            render(UserRole.Teacher);

            await waitFor(() => {
                expect(screen.getByText("deleteButton")).toBeInTheDocument();
            });

            await user.click(
                screen.getByRole("button", { name: "deleteButton" }),
            );

            await waitFor(() => {
                expect(mockToaster.create).toHaveBeenCalledWith(
                    expect.objectContaining({ type: "error" }),
                );
            });

            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });
});
