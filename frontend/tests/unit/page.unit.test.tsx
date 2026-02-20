import { render, screen } from "@testing-library/react";

describe("Example React Component Test", () => {
    it("Should render the component correctly", () => {
        render(<button>Click me</button>);

        expect(
            screen.getByRole("button", { name: /click me/i }),
        ).toBeInTheDocument();
    });
});
