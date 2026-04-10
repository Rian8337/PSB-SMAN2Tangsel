import { APIError } from "@/api";
import {
    CreateClassModal,
    CreateClassModalProps,
} from "@/components/admin/CreateClassModal";
import { ClassApiProvider } from "@/providers/api/class-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { mockClassApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockActiveSession: AcademicSessionDTO = {
    session: "2024/2025",
    semester: 1,
    active: true,
    startTime: new Date("2024-07-01").getTime(),
    endTime: new Date("2024-12-31").getTime(),
};

function render(props: Partial<CreateClassModalProps> = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onSuccess = props.onSuccess ?? vi.fn();

    const result = renderWithChakraProvider(
        <ClassApiProvider client={mockClassApiClient}>
            <CreateClassModal
                isOpen={props.isOpen ?? true}
                activeSession={props.activeSession ?? mockActiveSession}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        </ClassApiProvider>,
    );

    return { ...result, onClose, onSuccess };
}

describe("CreateClassModal (unit)", () => {
    it("should display validation error if required fields are missing", async () => {
        const user = userEvent.setup();

        render();

        const submitButton = screen.getByRole("button", {
            name: "create.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(screen.getByText("missingFields")).toBeInTheDocument();
        expect(mockClassApiClient.createClass).not.toHaveBeenCalled();
    });

    it("should display validation error if class name exceeds max length", async () => {
        const user = userEvent.setup();

        render();

        await user.type(
            screen.getByRole("textbox", { name: "fields.name.label" }),
            "A".repeat(51),
        );

        const submitButton = screen.getByRole("button", {
            name: "create.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(screen.getByText(/validation.maxLength/)).toBeInTheDocument();
        expect(mockClassApiClient.createClass).not.toHaveBeenCalled();
    });

    it("should successfully create a class and trigger callbacks", async () => {
        const user = userEvent.setup();

        mockClassApiClient.createClass.mockResolvedValue();

        const { onClose, onSuccess } = render();

        await user.type(
            screen.getByRole("textbox", { name: "fields.name.label" }),
            "X IPA 1",
        );

        const submitButton = screen.getByRole("button", {
            name: "create.dialog.submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockClassApiClient.createClass).toHaveBeenCalledWith(
                "X IPA 1",
                mockActiveSession.session,
                mockActiveSession.semester,
            );
        });

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("should handle API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Bad request";

        mockClassApiClient.createClass.mockRejectedValue(
            new APIError(400, errorMessage),
        );

        const { onClose, onSuccess } = render();

        await user.type(
            screen.getByRole("textbox", { name: "fields.name.label" }),
            "X IPA 1",
        );

        await user.click(
            screen.getByRole("button", { name: "create.dialog.submitButton" }),
        );

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
