import { MySchedule } from "@/components/schedule/MySchedule";
import { ScheduleDTO, ScheduleDay } from "@psb/shared/types";
import { mockScheduleApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSchedules: ScheduleDTO[] = [
    {
        id: 1,
        classSubjectId: 1,
        day: ScheduleDay.Monday,
        startTime: new Date(0, 0, 0, 8, 0).getTime(),
        endTime: new Date(0, 0, 0, 9, 0).getTime(),
        subject: {
            code: "MTK101",
            name: "Mathematics",
        },
    },
];

function render(schedules: ScheduleDTO[] = mockSchedules) {
    return renderWithChakraProvider(<MySchedule schedules={schedules} />);
}

describe("MySchedule (integration)", () => {
    beforeEach(() => {
        global.URL.createObjectURL = vi.fn(() => "mock-url");
        global.URL.revokeObjectURL = vi.fn();
    });

    it("should render the schedule title and download button", () => {
        render();

        expect(screen.getByText("title")).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "downloadButton" }),
        ).toBeInTheDocument();
    });

    it("should render the schedule grid with data", () => {
        render();

        expect(screen.getByText("Mathematics")).toBeInTheDocument();
    });

    it("should trigger schedule download when download button is clicked", async () => {
        const user = userEvent.setup();
        const mockBlob = new Blob(["test"], { type: "text/calendar" });

        mockScheduleApiClient.download.mockResolvedValue({
            blob: mockBlob,
            filename: "schedule.ics",
        });

        // Mock URL methods
        const createObjectURLSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("mock-url");

        const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");

        render();

        const downloadBtn = screen.getByRole("button", {
            name: "downloadButton",
        });

        await user.click(downloadBtn);

        await waitFor(() => {
            expect(mockScheduleApiClient.download).toHaveBeenCalled();
        });

        expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);

        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
    });
});
