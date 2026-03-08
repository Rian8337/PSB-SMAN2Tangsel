import { composeProviders } from "@/providers/composer";
import { render, screen } from "@testing-library/react";
import { PropsWithChildren } from "react";

const ProviderA = ({ children }: PropsWithChildren) => (
    <div data-testid="provider-A">{children}</div>
);

const ProviderB = ({ children }: PropsWithChildren) => (
    <div data-testid="provider-B">{children}</div>
);

const ProviderC = ({ children }: PropsWithChildren) => (
    <div data-testid="provider-C">{children}</div>
);

describe("composeProviders", () => {
    it("nests providers in the correct top-to-bottom order", () => {
        const Composed = composeProviders(ProviderA, ProviderB, ProviderC);

        render(
            <Composed>
                <span data-testid="target-child">Hello World</span>
            </Composed>,
        );

        const a = screen.getByTestId("provider-A");
        const b = screen.getByTestId("provider-B");
        const c = screen.getByTestId("provider-C");
        const child = screen.getByTestId("target-child");

        expect(a).toContainElement(b);
        expect(b).toContainElement(c);
        expect(c).toContainElement(child);

        expect(child).toHaveTextContent("Hello World");
    });
});
