import { APIError } from "@/api";
import {
    CreateScheduleModal,
    CreateScheduleModalProps,
} from "@/components/admin/CreateScheduleModal";
import { Class, ClassSubjectAssignment, ScheduleDay } from "@psb/shared/types";
import {
    mockClassSubjectApiClient,
    mockScheduleApiClient,
    mockToaster,
} from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const onClose = vi.fn();
const onSuccess = vi.fn();

const clazz: Class = {
    id: 1,
    name: "Class 1",
    session: "2024/2025",
    semester: 1,
};

function render(props: Partial<CreateScheduleModalProps> = {}) {
    return renderWithChakraProvider(
        <CreateScheduleModal
            clazz={clazz}
            isOpen={props.isOpen ?? true}
            onClose={onClose}
            onSuccess={onSuccess}
        />,
    );
}

describe("CreateScheduleModal (unit)", () => {
    const mockClassSubjectAssignment: ClassSubjectAssignment = {
        id: 1,
        teacher: { id: 1, name: "Teacher" },
        subject: { id: 1, code: "MA1", name: "Math" },
        class: { id: 1, name: "Class 1" },
    };

    it("renders the modal with all form fields and defaults when open", () => {
        render();

        expect(
            screen.getByRole("heading", { name: /create\.title/ }),
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText("fields.subject.placeholder"),
        ).toBeInTheDocument();

        const daySelect = screen.getByRole("combobox", {
            name: "fields.day.label",
        });

        expect(daySelect).toBeInTheDocument();
        expect(daySelect).toHaveValue(ScheduleDay.monday.toString());

        // Inputs for time
        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        expect(startInput).toBeInTheDocument();
        expect(endInput).toBeInTheDocument();
    });

    it("shows a validation error if required fields are missing", async () => {
        const user = userEvent.setup();
        render();

        const submitButton = screen.getByRole("button", {
            name: "create.submitButton",
        });

        await user.click(submitButton);

        expect(await screen.findByText("missingFields")).toBeInTheDocument();
        expect(mockScheduleApiClient.createSchedule).not.toHaveBeenCalled();
    });

    it("shows a validation error if end time is before start time", async () => {
        const user = userEvent.setup();
        render();

        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValueOnce([
            mockClassSubjectAssignment,
        ]);

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.type(subjectInput, "Math");
        await user.click(await screen.findByText("MA1 - Math"));

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        await user.type(startInput, "10:00");
        await user.type(endInput, "09:00");

        const submitButton = screen.getByRole("button", {
            name: "create.submitButton",
        });

        await user.click(submitButton);

        expect(await screen.findByText("invalidDateRange")).toBeInTheDocument();
        expect(mockScheduleApiClient.createSchedule).not.toHaveBeenCalled();
    });

    it("submits the form successfully and triggers callbacks", async () => {
        const user = userEvent.setup();
        mockScheduleApiClient.createSchedule.mockResolvedValueOnce(undefined);

        render();

        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValueOnce([
            mockClassSubjectAssignment,
        ]);

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.type(subjectInput, "Math");
        await user.click(await screen.findByText("MA1 - Math"));

        await user.selectOptions(
            screen.getByRole("combobox", { name: "fields.day.label" }),
            ScheduleDay.tuesday.toString(),
        );

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        await user.type(startInput, "08:00");
        await user.type(endInput, "09:30");

        const submitButton = screen.getByRole("button", {
            name: "create.submitButton",
        });
        await user.click(submitButton);

        // Construct the expected dates to match against
        const expectedStartDate = new Date();
        expectedStartDate.setHours(8, 0, 0, 0);

        const expectedEndDate = new Date();
        expectedEndDate.setHours(9, 30, 0, 0);

        await waitFor(() => {
            expect(mockScheduleApiClient.createSchedule).toHaveBeenCalledWith({
                classSubjectId: 1,
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

    it("handles API errors gracefully and shows an error toast", async () => {
        const user = userEvent.setup();

        mockScheduleApiClient.createSchedule.mockRejectedValueOnce(
            new APIError(409, "Schedule conflict exists"),
        );

        mockClassSubjectApiClient.listAssignedSubjects.mockResolvedValueOnce([
            mockClassSubjectAssignment,
        ]);

        render();

        const subjectInput = screen.getByPlaceholderText(
            "fields.subject.placeholder",
        );

        await user.type(subjectInput, "Math");
        await user.click(await screen.findByText("MA1 - Math"));

        const startInput = screen.getByLabelText("fields.startTime.label");
        const endInput = screen.getByLabelText("fields.endTime.label");

        await user.type(startInput, "08:00");
        await user.type(endInput, "09:30");

        const submitButton = screen.getByRole("button", {
            name: "create.submitButton",
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

    it("resets the form and closes when the cancel button is clicked", async () => {
        const user = userEvent.setup();
        render();

        const startInput = screen.getByLabelText("fields.startTime.label");

        await user.type(startInput, "08:00");
        await user.click(
            screen.getByRole("button", { name: "create.cancelButton" }),
        );

        expect(onClose).toHaveBeenCalled();
        expect(startInput).toHaveValue("");
    });
});
