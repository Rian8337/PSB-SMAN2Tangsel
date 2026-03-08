import { ComponentType, ReactNode } from "react";

interface ProviderProps {
    children: ReactNode;
}

/**
 * Composes multiple providers into a single provider component. The resulting component will render the given children wrapped in all the provided components.
 *
 * @param Providers An array of provider components to compose.
 * @returns A single provider component that renders the given children wrapped in all the provided components.
 */
export const composeProviders =
    (...Providers: ComponentType<ProviderProps>[]) =>
    ({ children }: ProviderProps) =>
        Providers.reduceRight(
            (tree, Provider) => <Provider>{tree}</Provider>,
            children,
        );
