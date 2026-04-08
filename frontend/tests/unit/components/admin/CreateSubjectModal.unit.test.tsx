import { APIError } from "@/api";
import {
    CreateSubjectModal,
    CreateSubjectModalProps,
} from "@/components/admin/CreateSubjectModal";
import { SubjectApiProvider } from "@/providers/api/subject-api-provider";
import { mockSubjectApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function render(props: Partial<CreateSubjectModalProps> = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onSuccess = props.onSuccess ?? vi.fn();

    const result = renderWithChakraProvider(
        <SubjectApiProvider client={mockSubjectApiClient}>
            <CreateSubjectModal
                isOpen={props.isOpen ?? true}
                onClose={onClose}
                onSuccess={onSuccess}
            />
            ,
        </SubjectApiProvider>,
    );

    return { ...result, onClose, onSuccess };
}

describe("CreateSubjectModal", () => {
    it("should display validation error if required fields are missing", async () => {
        const user = userEvent.setup();

        render();

        const submitButton = screen.getByRole("button", {
            name: "create.dialog.submitButton",
        });

        await user.click(submitButton);

        expect(screen.getByText("missingFields")).toBeInTheDocument();
        expect(mockSubjectApiClient.createSubject).not.toHaveBeenCalled();
    });

    it("should successfully create a subject and trigger callbacks", async () => {
        const user = userEvent.setup();

        mockSubjectApiClient.createSubject.mockResolvedValue();

        const { onClose, onSuccess } = render();

        await user.type(
            screen.getByRole("textbox", { name: "fields.code.label" }),
            "MA101",
        );

        await user.type(
            screen.getByRole("textbox", { name: "fields.name.label" }),
            "Matematika",
        );

        const submitButton = screen.getByRole("button", {
            name: "create.dialog.submitButton",
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(mockSubjectApiClient.createSubject).toHaveBeenCalledWith(
                "MA101",
                "Matematika",
            );
        });

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("should handle API errors gracefully", async () => {
        const user = userEvent.setup();
        const errorMessage = "Bad request";

        mockSubjectApiClient.createSubject.mockRejectedValue(
            new APIError(400, errorMessage),
        );

        const { onClose, onSuccess } = render();

        await user.type(
            screen.getByRole("textbox", { name: "fields.code.label" }),
            "MA101",
        );

        await user.type(
            screen.getByRole("textbox", { name: "fields.name.label" }),
            "Matematika",
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
