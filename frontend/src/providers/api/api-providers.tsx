import { composeProviders } from "../composer";
import { AnalyticsApiProvider } from "./analytics-api-provider";
import { AuthApiProvider } from "./auth-api-provider";
import { BookmarkApiProvider } from "./bookmark-api-provider";
import { ClassApiProvider } from "./class-api-provider";
import { ClassStudentApiProvider } from "./class-student-api-provider";
import { ClassSubjectApiProvider } from "./class-subject-api-provider";
import { NotificationApiProvider } from "./notification-api-provider";
import { ScheduleApiProvider } from "./schedule-api-provider";
import { SessionApiProvider } from "./session-api-provider";
import { SubjectApiProvider } from "./subject-api-provider";
import { SubjectDashboardApiProvider } from "./subject-dashboard-api-provider";
import { SubjectAssignmentApiProvider } from "./subject-assignment-api-provider";
import { SubjectAssignmentSubmissionApiProvider } from "./subject-assignment-submission-api-provider";
import { SubjectMaterialApiProvider } from "./subject-material-api-provider";
import { UserApiProvider } from "./user-api-provider";

/**
 * All API providers. Can be used to wrap the entire application to provide API clients to all components.
 */
export const ApiProviders = composeProviders(
    AnalyticsApiProvider,
    AuthApiProvider,
    BookmarkApiProvider,
    ClassApiProvider,
    ClassStudentApiProvider,
    ClassSubjectApiProvider,
    NotificationApiProvider,
    ScheduleApiProvider,
    SessionApiProvider,
    SubjectApiProvider,
    SubjectDashboardApiProvider,
    SubjectAssignmentApiProvider,
    SubjectAssignmentSubmissionApiProvider,
    SubjectMaterialApiProvider,
    UserApiProvider,
);
