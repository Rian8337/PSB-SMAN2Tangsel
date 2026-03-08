import { PropsWithChildren } from "react";

/**
 * Common interface used to inject custom API client implementations to components.
 *
 * @param TAPIClient The type of the API client to inject.
 */
export type ApiProviderProps<TAPIClient> = PropsWithChildren<{
    /**
     * The API client implementation to use. Defaults to the real implementation.
     */
    client?: TAPIClient;
}>;
