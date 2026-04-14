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
                classSubjectId: 1,
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

        const innerFlex = classBlock.closest("div");
        const parentBox = innerFlex?.parentElement;

        expect(parentBox).toHaveStyle({ height: "65rem" });
    });

    it("should calculate correct height and position for a multi-hour class starting on an off-hour", () => {
        const mockSchedule: ScheduleDTO[] = [
            {
                id: 1,
                classSubjectId: 1,
                day: ScheduleDay.wednesday,
                startTime: new Date(2024, 0, 1, 10, 15).getTime(),
                endTime: new Date(2024, 0, 1, 12, 45).getTime(),
                subject: { code: "FA1", name: "Fisika" },
            },
        ];

        renderScheduleGrid(mockSchedule);

        const classBlock = screen.getByText(/fisika/i);
        const innerFlex = classBlock.closest("div");
        const parentBox = innerFlex?.parentElement;

        expect(parentBox).toHaveStyle({ height: "65rem" });
    });
});
