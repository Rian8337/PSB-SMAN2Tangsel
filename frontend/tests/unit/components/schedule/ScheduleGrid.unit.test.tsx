import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";

function renderScheduleGrid(data: ScheduleDTO[]) {
    renderWithChakraProvider(<ScheduleGrid data={data} />);
}

describe("ScheduleGrid (unit)", () => {
    it("should render the grid layout with days and hours", () => {
        renderScheduleGrid([]);

        expect(screen.getByText(/time/i)).toBeInTheDocument();
        expect(screen.getByText(/monday/i)).toBeInTheDocument();
        expect(screen.getByText(/tuesday/i)).toBeInTheDocument();
        expect(screen.getByText(/wednesday/i)).toBeInTheDocument();
        expect(screen.getByText(/thursday/i)).toBeInTheDocument();
        expect(screen.getByText(/friday/i)).toBeInTheDocument();

        expect(screen.getByText(/06:00/i)).toBeInTheDocument();
        expect(screen.getByText(/07:00/i)).toBeInTheDocument();
        expect(screen.getByText(/08:00/i)).toBeInTheDocument();
        expect(screen.getByText(/09:00/i)).toBeInTheDocument();
        expect(screen.getByText(/10:00/i)).toBeInTheDocument();
        expect(screen.getByText(/11:00/i)).toBeInTheDocument();
        expect(screen.getByText(/12:00/i)).toBeInTheDocument();
    });

    it("should render a scheduled class at the correct position", () => {
        const mockSchedule: ScheduleDTO[] = [
            {
                id: 1,
                day: ScheduleDay.monday,
                startTime: new Date(2024, 0, 1, 8).getTime(),
                endTime: new Date(2024, 0, 1, 9, 30).getTime(),
                subject: {
                    code: "MA1",
                    name: "Matematika Lanjut",
                },
            },
        ];

        renderScheduleGrid(mockSchedule);

        const classBlock = screen.getByText(/matematika lanjut/i);
        expect(classBlock).toBeInTheDocument();

        // Start is 8:00 (start hour is 6), so top offset should be (8 - 6) * 5rem = 10rem.
        // End is 9:30 (1.5 hours), so height should be 1.5 * 5rem = 7.5rem.
        const parentBox = classBlock.closest("div");

        expect(parentBox).toHaveStyle({
            top: "10rem",
            height: "7.5rem",
        });
    });

    it("should calculate correct height and position for a multi-hour class starting on an off-hour", () => {
        const mockSchedule: ScheduleDTO[] = [
            {
                id: 1,
                day: ScheduleDay.wednesday,
                startTime: new Date(2024, 0, 1, 10, 15).getTime(),
                endTime: new Date(2024, 0, 1, 12, 45).getTime(),
                subject: { code: "FA1", name: "Fisika" },
            },
        ];

        renderScheduleGrid(mockSchedule);

        const classBlock = screen.getByText(/fisika/i);
        const parentBox = classBlock.closest("div");

        // 10:15 is 10.25 in decimal. Top: (10.25 - 6) * 5 = 4.25 * 5 = 21.25rem
        // 12:45 is 12.75 in decimal. Height: (12.75 - 10.25) * 5 = 2.5 * 5 = 12.5rem
        expect(parentBox).toHaveStyle({
            top: "21.25rem",
            height: "12.5rem",
        });
    });
});
