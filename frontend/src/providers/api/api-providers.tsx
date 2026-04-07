import { composeProviders } from "../composer";
import { AuthApiProvider } from "./auth-api-provider";
import { NotificationApiProvider } from "./notification-api-provider";
import { ScheduleApiProvider } from "./schedule-api-provider";
import { SessionApiProvider } from "./session-api-provider";
import { SubjectApiProvider } from "./subject-api-provider";
import { UserApiProvider } from "./user-api-provider";

/**
 * All API providers. Can be used to wrap the entire application to provide API clients to all components.
 */
export const ApiProviders = composeProviders(
    AuthApiProvider,
    NotificationApiProvider,
    ScheduleApiProvider,
    SessionApiProvider,
    SubjectApiProvider,
    UserApiProvider,
);
