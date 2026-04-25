import { MySubjects } from "@/components/subjects/MySubjects";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { SubjectApiProvider } from "@/providers/api/subject-api-provider";
import { ClassSubjectAssignment } from "@psb/shared/types";
import { mockNotificationApiClient, mockSubjectApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockAssignedSubjects: ClassSubjectAssignment[] = [
    {
        id: 1,
        subject: {
            id: 1,
            code: "MTK101",
            name: "Mathematics",
        },
        class: {
            id: 1,
            name: "X-1",
        },
        teacher: {
            id: 1,
            name: "Dr. Smith",
        },
    },
    {
        id: 2,
        subject: {
            id: 2,
            code: "PHY101",
            name: "Physics",
        },
        class: {
            id: 2,
            name: "X-2",
        },
        teacher: null,
    },
];

function render() {
    return renderWithChakraProvider(
        <NotificationApiProvider client={mockNotificationApiClient}>
            <SubjectApiProvider client={mockSubjectApiClient}>
                <MySubjects />
            </SubjectApiProvider>
        </NotificationApiProvider>,
    );
}

describe("MySubjects (integration)", () => {
    it("should fetch and display registered subjects on mount", async () => {
        mockSubjectApiClient.getMySubjects.mockResolvedValue(mockAssignedSubjects);

        render();

        expect(mockSubjectApiClient.getMySubjects).toHaveBeenCalledWith(
            "",
            10,
            0,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByText("Mathematics")).toBeInTheDocument();
            expect(screen.getByText("Physics")).toBeInTheDocument();
            expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
            expect(screen.getByText("X-1")).toBeInTheDocument();
            expect(screen.getByText("X-2")).toBeInTheDocument();
        });
    });

    it("should display empty state if no subjects are found", async () => {
        mockSubjectApiClient.getMySubjects.mockResolvedValue([]);

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });

    it("should trigger a debounced search when typing in the search input", async () => {
        const user = userEvent.setup();
        mockSubjectApiClient.getMySubjects.mockResolvedValue([]);

        render();

        const searchInput = screen.getByPlaceholderText("searchPlaceholder");
        await user.type(searchInput, "Math");

        await waitFor(() => {
            expect(mockSubjectApiClient.getMySubjects).toHaveBeenCalledWith(
                "Math",
                10,
                0,
                expect.any(AbortSignal),
            );
        });
    });
});
