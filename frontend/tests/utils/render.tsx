import { ApiProviderProps } from "@/providers/api/api-provider-props";
import { AuthApiProvider } from "@/providers/api/auth-api-provider";
import { ClassApiProvider } from "@/providers/api/class-api-provider";
import { ClassStudentApiProvider } from "@/providers/api/class-student-api-provider";
import { ClassSubjectApiProvider } from "@/providers/api/class-subject-api-provider";
import { NotificationApiProvider } from "@/providers/api/notification-api-provider";
import { ScheduleApiProvider } from "@/providers/api/schedule-api-provider";
import { SessionApiProvider } from "@/providers/api/session-api-provider";
import { SubjectApiProvider } from "@/providers/api/subject-api-provider";
import { SubjectAssignmentApiProvider } from "@/providers/api/subject-assignment-api-provider";
import { SubjectAssignmentSubmissionApiProvider } from "@/providers/api/subject-assignment-submission-api-provider";
import { SubjectDashboardApiProvider } from "@/providers/api/subject-dashboard-api-provider";
import { SubjectMaterialApiProvider } from "@/providers/api/subject-material-api-provider";
import { UserApiProvider } from "@/providers/api/user-api-provider";
import { composeProviders } from "@/providers/composer";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
    mockAuthApiClient,
    mockClassApiClient,
    mockClassStudentApiClient,
    mockClassSubjectApiClient,
    mockNotificationApiClient,
    mockScheduleApiClient,
    mockSessionApiClient,
    mockSubjectApiClient,
    mockSubjectAssignmentApiClient,
    mockSubjectAssignmentSubmissionApiClient,
    mockSubjectDashboardApiClient,
    mockSubjectMaterialApiClient,
    mockUserApiClient,
} from "@test/mocks";
import { render } from "@testing-library/react";

type RenderOptions = Parameters<typeof render>[1] & {
    readonly systemContext?: typeof defaultSystem;
};

/**
 * Binds a mock client to an API provider, producing a children-only component compatible with `composeProviders`.
 */
function bindClient<T>(
    Provider: React.ComponentType<ApiProviderProps<T>>,
    client: T,
): React.ComponentType<{ children: React.ReactNode }> {
    return ({ children }) => <Provider client={client}>{children}</Provider>;
}

/**
 * All API providers wired to their mock clients.
 * Inner providers added by individual tests take precedence (nearest-ancestor wins).
 */
const MockApiProviders = composeProviders(
    bindClient(AuthApiProvider, mockAuthApiClient),
    bindClient(SessionApiProvider, mockSessionApiClient),
    bindClient(ClassApiProvider, mockClassApiClient),
    bindClient(ClassStudentApiProvider, mockClassStudentApiClient),
    bindClient(ClassSubjectApiProvider, mockClassSubjectApiClient),
    bindClient(NotificationApiProvider, mockNotificationApiClient),
    bindClient(ScheduleApiProvider, mockScheduleApiClient),
    bindClient(SubjectApiProvider, mockSubjectApiClient),
    bindClient(SubjectDashboardApiProvider, mockSubjectDashboardApiClient),
    bindClient(SubjectAssignmentApiProvider, mockSubjectAssignmentApiClient),
    bindClient(
        SubjectAssignmentSubmissionApiProvider,
        mockSubjectAssignmentSubmissionApiClient,
    ),
    bindClient(SubjectMaterialApiProvider, mockSubjectMaterialApiClient),
    bindClient(UserApiProvider, mockUserApiClient),
);

/**
 * Renders a React component wrapped in a ChakraProvider and all mock API providers.
 * Tests that need to control a specific API client can add their own inner provider — it takes precedence.
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
            <MockApiProviders>{ui}</MockApiProviders>
        </ChakraProvider>,
        options,
    );
}
