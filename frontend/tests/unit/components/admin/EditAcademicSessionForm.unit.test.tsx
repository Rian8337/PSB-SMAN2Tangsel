import { APIError } from "@/api";
import { EditAcademicSessionForm } from "@/components/admin/EditAcademicSessionForm";
import { SessionApiProvider } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { mockRouter, mockSessionApiClient, mockToaster } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const initialStartDate = new Date("2024-08-01T12:00:00");
const initialEndDate = new Date("2024-12-15T12:00:00");

const mockSession: AcademicSessionDTO = {
    session: "2024/2025",
    semester: 1,
    startTime: initialStartDate.getTime(),
    endTime: initialEndDate.getTime(),
    active: false,
};

function render() {
    return renderWithChakraProvider(
        <SessionApiProvider client={mockSessionApiClient}>
            <EditAcademicSessionForm session={mockSession} />,
        </SessionApiProvider>,
    );
}

describe("EditAcademicSessionForm (unit)", () => {
    it("renders the form with initial session data", () => {
        render();

        expect(
            screen.getByRole("heading", { name: "title" }),
        ).toBeInTheDocument();

        const sessionDisplay = screen.getByDisplayValue(
            `${mockSession.session} - fields.semester.label ${mockSession.semester.toString()}`,
        );

        expect(sessionDisplay).toBeInTheDocument();
        expect(sessionDisplay).toBeDisabled();

        const startInput = screen.getByDisplayValue("2024-08-01");
        const endInput = screen.getByDisplayValue("2024-12-15");

        expect(startInput).toBeInTheDocument();
        expect(endInput).toBeInTheDocument();

        const activeSwitch = screen.getByRole("checkbox");
        expect(activeSwitch).toBeInTheDocument();
        expect(activeSwitch).not.toBeChecked();
        expect(activeSwitch).toBeEnabled();
    });

    it("shows a validation error if required fields are missing", async () => {
        const user = userEvent.setup();
        const { container } = render();

        const startInput = container.querySelector<HTMLInputElement>(
            'input[name="startTime"]',
        )!;

        const submitButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(startInput);
        await user.click(submitButton);

        expect(await screen.findByText("missingFields")).toBeInTheDocument();
        expect(mockSessionApiClient.updateSession).not.toHaveBeenCalled();
    });

    it("shows a validation error if end date is before start date", async () => {
        const user = userEvent.setup();
        const { container } = render();

        const endInput = container.querySelector<HTMLInputElement>(
            'input[name="endTime"]',
        )!;

        const submitButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(endInput);
        await user.type(endInput, "2024-07-01");
        await user.click(submitButton);

        expect(await screen.findByText("invalidDateRange")).toBeInTheDocument();
        expect(mockSessionApiClient.updateSession).not.toHaveBeenCalled();
    });

    it("submits successfully and redirects", async () => {
        const user = userEvent.setup();
        mockSessionApiClient.updateSession.mockResolvedValueOnce(undefined);

        const { container } = render();

        const startInput = container.querySelector<HTMLInputElement>(
            'input[name="startTime"]',
        )!;

        const activeSwitch = screen.getByRole("checkbox");

        const submitButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.clear(startInput);
        await user.type(startInput, "2024-08-15");
        await user.click(activeSwitch.closest("label")!);
        await user.click(submitButton);

        const expectedStartTimestamp = new Date("2024-08-15").getTime();
        const expectedEndTimestamp = new Date("2024-12-15").getTime();

        await waitFor(() => {
            expect(mockSessionApiClient.updateSession).toHaveBeenCalledWith(
                mockSession.session,
                mockSession.semester,
                expectedStartTimestamp,
                expectedEndTimestamp,
                true,
            );
        });

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );

        expect(mockRouter.push).toHaveBeenCalledWith("/admin/academic-year");
        expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it("handles API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "API error occurred";

        mockSessionApiClient.updateSession.mockRejectedValueOnce(
            new APIError(400, errorMessage),
        );

        render();

        const submitButton = screen.getByRole("button", {
            name: "updateButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockSessionApiClient.updateSession).toHaveBeenCalled();
        });

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
        );

        expect(mockRouter.push).not.toHaveBeenCalled();
    });
});
