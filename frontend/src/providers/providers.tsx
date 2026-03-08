import { ApiProviders } from "./api/api-providers";
import { compose } from "./composer";

/**
 * All providers for the application, excluding library-provided ones.
 */
export const AppProviders = compose(ApiProviders);