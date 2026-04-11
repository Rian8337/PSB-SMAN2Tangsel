import { AsyncSelect, AsyncSelectOption } from "@/components/ui/AsyncSelect";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { vi } from "vitest";

const fetchOptions = vi.fn();
const onChange = vi.fn();

const mockData: AsyncSelectOption[] = [
    { value: 1, label: "Mathematics" },
    { value: 2, label: "Physics" },
];

function render(props: Partial<ComponentProps<typeof AsyncSelect>> = {}) {
    return renderWithChakraProvider(
        <AsyncSelect
            placeholder={props.placeholder ?? "Search subjects..."}
            onChange={onChange}
            fetchOptions={fetchOptions}
            {...props}
        />,
    );
}

describe("AsyncSelect (unit)", () => {
    it("should render with the correct placeholder", () => {
        render();

        expect(
            screen.getByPlaceholderText("Search subjects..."),
        ).toBeInTheDocument();
    });

    it("should initialize with a pre-selected value", () => {
        render({ value: mockData[0] });

        expect(screen.getByRole("textbox")).toHaveValue("Mathematics");
    });

    it("should fetch and display options when typing", async () => {
        const user = userEvent.setup();
        fetchOptions.mockResolvedValue(mockData);

        render();

        const input = screen.getByPlaceholderText("Search subjects...");
        await user.type(input, "Math");

        // Wait for debounce and fetch to complete.
        await waitFor(() => {
            expect(fetchOptions).toHaveBeenCalledWith(
                "Math",
                expect.any(AbortSignal),
            );
        });

        expect(await screen.findByText("Mathematics")).toBeInTheDocument();
        expect(await screen.findByText("Physics")).toBeInTheDocument();
    });

    it("should display a 'no results' message when fetch returns empty", async () => {
        const user = userEvent.setup();
        fetchOptions.mockResolvedValue([]);

        render();

        const input = screen.getByPlaceholderText("Search subjects...");
        await user.type(input, "Unknown");

        await waitFor(() => {
            expect(fetchOptions).toHaveBeenCalled();
        });

        expect(await screen.findByText(/noResults/i)).toBeInTheDocument();
    });

    it("should call onChange and close dropdown when an option is selected", async () => {
        const user = userEvent.setup();
        fetchOptions.mockResolvedValue(mockData);

        render();

        const input = screen.getByPlaceholderText("Search subjects...");
        await user.type(input, "Math");

        const option = await screen.findByText("Mathematics");
        await user.click(option);

        expect(onChange).toHaveBeenCalledWith(mockData[0]);
        expect(input).toHaveValue("Mathematics");

        // Verify the dropdown closed (the option is no longer in the document).
        expect(screen.queryByText("Physics")).not.toBeInTheDocument();
    });

    it("should clear the selection if the user starts typing after making a selection", async () => {
        const user = userEvent.setup();
        fetchOptions.mockResolvedValue(mockData);

        // Start with a pre-selected value.
        render({ value: mockData[0] });

        const input = screen.getByRole("textbox");
        await user.type(input, "s");

        // Verify that typing immediately cleared the underlying selected value.
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should close the dropdown when clicking outside", async () => {
        const user = userEvent.setup();

        fetchOptions.mockResolvedValue(mockData);

        renderWithChakraProvider(
            <div data-testid="outside">
                <AsyncSelect
                    placeholder="Search..."
                    onChange={onChange}
                    fetchOptions={fetchOptions}
                />
            </div>,
        );

        const input = screen.getByPlaceholderText("Search...");
        const outsideDiv = screen.getByTestId("outside");

        await user.click(input);

        // Wait for the initial fetch that triggers on open/focus.
        await waitFor(() => {
            expect(fetchOptions).toHaveBeenCalled();
        });

        expect(await screen.findByText("Mathematics")).toBeInTheDocument();

        await user.click(outsideDiv);

        // Verify dropdown closed.
        expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
    });
});
