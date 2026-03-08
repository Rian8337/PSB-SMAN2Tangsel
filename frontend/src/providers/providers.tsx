import { ApiProviders } from "./api/api-providers";
import { composeProviders } from "./composer";

/**
 * All providers for the application, excluding library-provided ones.
 */
export const AppProviders = composeProviders(ApiProviders);
