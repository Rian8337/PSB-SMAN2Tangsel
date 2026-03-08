import { compose } from "../composer";
import { AuthApiProvider } from "./auth-api-provider";

/**
 * All API providers. Can be used to wrap the entire application to provide API clients to all components.
 */
export const ApiProviders = compose(AuthApiProvider);
