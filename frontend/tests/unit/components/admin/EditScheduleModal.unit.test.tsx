import { APIError } from "@/api";
import {
    EditScheduleModal,
    EditScheduleModalProps,
} from "@/components/admin/EditScheduleModal";
import { ScheduleApiProvider } from "@/providers/api/schedule-api-provider";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { mockScheduleApiClient, mockToaster } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const onClose = vi.fn();
const onSuccess = vi.fn();

const createLocalTimestamp = (hours: number, minutes: number) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);

    return d.getTime();
};

const mockSchedule: ScheduleDTO = {
    id: 1,
    classSubjectId: 1,
    day: ScheduleDay.monday,
    startTime: createLocalTimestamp(8, 0),
    endTime: createLocalTimestamp(9, 30),
    subject: { code: "MA1", name: "Math" },
};

function render(props: Partial<EditScheduleModalProps> = {}) {
    return renderWithChakraProvider(
        <ScheduleApiProvider client={mockScheduleApiClient}>
            <EditScheduleModal
                scheduleId={props.scheduleId ?? mockSchedule.id}
                isOpen={props.isOpen ?? true}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        </ScheduleApiProvider>,
    );
}

describe("EditScheduleModal (unit)", () => {
    it("fetches the schedule and populates the form fields on mount", async () => {
        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);

        render();

        expect(mockScheduleApiClient.getById).toHaveBeenCalledWith(
            mockSchedule.id,
            expect.any(AbortSignal),
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const daySelect = screen.getByRole("combobox", {
            name: "fields.day.label",
        });

        expect(daySelect).toHaveValue(ScheduleDay.monday.toString());

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        expect(startInput).toHaveValue("08:00");
        expect(endInput).toHaveValue("09:30");
    });

    it("shows an error toast if the initial fetch fails", async () => {
        mockScheduleApiClient.getById.mockRejectedValue(
            new Error("Failed to fetch"),
        );

        render();

        await waitFor(() => {
            expect(mockToaster.create).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error" }),
            );
        });
    });

    it("shows a validation error if end time is before start time", async () => {
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        await user.clear(startInput);
        await user.type(startInput, "10:00");

        await user.clear(endInput);
        await user.type(endInput, "09:00");

        const submitButton = screen.getByRole("button", {
            name: "edit.submitButton",
        });

        await user.click(submitButton);

        expect(await screen.findByText("invalidDateRange")).toBeInTheDocument();
        expect(mockScheduleApiClient.updateSchedule).not.toHaveBeenCalled();
    });

    it("submits the form successfully and triggers callbacks", async () => {
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);
        mockScheduleApiClient.updateSchedule.mockResolvedValue(undefined);

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        await user.selectOptions(
            screen.getByRole("combobox", { name: "fields.day.label" }),
            ScheduleDay.tuesday.toString(),
        );

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        await user.clear(startInput);
        await user.type(startInput, "10:30");

        await user.clear(endInput);
        await user.type(endInput, "12:00");

        const submitButton = screen.getByRole("button", {
            name: "edit.submitButton",
        });

        await user.click(submitButton);

        const expectedStartDate = new Date();
        expectedStartDate.setHours(10, 30, 0, 0);

        const expectedEndDate = new Date();
        expectedEndDate.setHours(12, 0, 0, 0);

        await waitFor(() => {
            expect(mockScheduleApiClient.updateSchedule).toHaveBeenCalledWith({
                id: mockSchedule.id,
                day: ScheduleDay.tuesday,
                startTime: expectedStartDate,
                endTime: expectedEndDate,
            });
        });

        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("handles API errors gracefully during update and shows an error toast", async () => {
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);

        mockScheduleApiClient.updateSchedule.mockRejectedValueOnce(
            new APIError(409, "Schedule conflict exists"),
        );

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const submitButton = screen.getByRole("button", {
            name: "edit.submitButton",
        });

        await user.click(submitButton);

        expect(
            await screen.findByText("Schedule conflict exists"),
        ).toBeInTheDocument();

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
        );
    });

    it("does not delete the schedule if the user cancels the confirmation", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole("button", {
            name: "edit.deleteButton",
        });

        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockScheduleApiClient.deleteSchedule).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("deletes the schedule successfully and triggers callbacks", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);
        mockScheduleApiClient.deleteSchedule.mockResolvedValue(undefined);

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole("button", {
            name: "edit.deleteButton",
        });

        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockScheduleApiClient.deleteSchedule).toHaveBeenCalledWith(
                mockSchedule.id,
            );
        });

        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("handles API errors gracefully during deletion and shows an error toast", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);
        mockScheduleApiClient.deleteSchedule.mockRejectedValueOnce(
            new APIError(500, "Failed to delete schedule"),
        );

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole("button", {
            name: "edit.deleteButton",
        });

        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();

        expect(
            await screen.findByText("Failed to delete schedule"),
        ).toBeInTheDocument();

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();

        expect(mockToaster.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
        );
    });

    it("resets the form and closes when the cancel button is clicked", async () => {
        const user = userEvent.setup();

        mockScheduleApiClient.getById.mockResolvedValue(mockSchedule);

        render();

        await waitFor(() => {
            expect(screen.getByDisplayValue("(MA1) Math")).toBeInTheDocument();
        });

        const startInput = screen.getByLabelText("fields.startTime.label");

        await user.clear(startInput);
        await user.type(startInput, "11:00");

        await user.click(
            screen.getByRole("button", { name: "edit.cancelButton" }),
        );

        expect(onClose).toHaveBeenCalled();
    });
});
