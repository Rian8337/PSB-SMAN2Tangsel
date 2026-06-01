import { ClassScheduleManagement } from "@/components/admin/ClassScheduleManagement";
import { Class, ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { mockClassApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockClass: Class = {
    id: 1,
    name: "X IPA 1",
    session: "2024/2025",
    semester: 1,
};

const mockSchedules: ScheduleDTO[] = [
    {
        id: 99,
        classSubjectId: 123,
        day: ScheduleDay.monday,
        startTime: new Date().setHours(8, 0, 0, 0),
        endTime: new Date().setHours(9, 30, 0, 0),
        subject: {
            code: "BI101",
            name: "Biologi",
        },
    },
];

function render() {
    return renderWithChakraProvider(
        <ClassScheduleManagement clazz={mockClass} />,
    );
}

describe("ClassScheduleManagement (integration)", () => {
    it("should fetch schedules and render them", async () => {
        mockClassApiClient.getClassSchedule.mockResolvedValue(mockSchedules);

        render();

        expect(mockClassApiClient.getClassSchedule).toHaveBeenCalledWith(
            mockClass.id,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByText("Biologi")).toBeInTheDocument();
        });

        expect(screen.getByText("08:00")).toBeInTheDocument();
    });

    it("should open the Create modal when the add button is clicked", async () => {
        const user = userEvent.setup();
        mockClassApiClient.getClassSchedule.mockResolvedValue([]);

        render();

        const addButton = await screen.findByRole("button", {
            name: /addButton/i,
        });
        await user.click(addButton);

        // We assert against the actual DOM rendered by CreateScheduleModal
        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
    });

    it("should open the Edit modal with correct context when a schedule block is clicked", async () => {
        const user = userEvent.setup();
        mockClassApiClient.getClassSchedule.mockResolvedValue(mockSchedules);

        render();

        const scheduleBlock = await screen.findByText("Biologi");

        const clickableButton = scheduleBlock.closest("button");
        expect(clickableButton).not.toBeNull();

        await user.click(clickableButton!);

        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
    });
});
