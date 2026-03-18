import { ApiProviders } from "@/providers/api/api-providers";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";

type RenderOptions = Parameters<typeof render>[1] & {
    readonly systemContext?: typeof defaultSystem;
};

/**
 * Renders a React component wrapped in a ChakraProvider. Useful for testing components that rely on
 * Chakra's theming or context.
 *
 * @param ui The React element to render.
 * @param options Optional render options from @testing-library/react and an optional custom Chakra system context.
 * @returns The result of the render, including utility functions for querying the rendered component.
 */
export function renderWithChakraProvider(
    ui: React.ReactElement,
    options?: RenderOptions,
) {
    return render(
        <ChakraProvider value={options?.systemContext ?? defaultSystem}>
            {ui}
        </ChakraProvider>,
        options,
    );
}

/**
 * Renders a React component wrapped in all API providers. Useful for testing components that rely on
 * API clients provided by the ApiProviders.
 *
 * @param ui The React element to render.
 * @param options Optional render options from @testing-library/react and an optional custom Chakra system context.
 * @returns The result of the render, including utility functions for querying the rendered component.
 */
export function renderWithApiProviders(
    ui: React.ReactElement,
    options?: RenderOptions,
) {
    return renderWithChakraProvider(<ApiProviders>{ui}</ApiProviders>, options);
}
