import { Locale } from "next-intl";
import { getLocale } from "next-intl/server";
import { APIClient } from "./APIClient";
import { AuthAPIClient } from "./AuthAPIClient";
import { ClassAPIClient } from "./ClassAPIClient";
import { ClassStudentAPIClient } from "./ClassStudentAPIClient";
import { ClassSubjectAPIClient } from "./ClassSubjectAPIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";
import { IClassAPIClient } from "./IClassAPIClient";
import { IClassStudentAPIClient } from "./IClassStudentAPIClient";
import { IClassSubjectAPIClient } from "./IClassSubjectAPIClient";
import { INotificationAPIClient } from "./INotificationAPIClient";
import { IScheduleAPIClient } from "./IScheduleAPIClient";
import { ISessionAPIClient } from "./ISessionAPIClient";
import { ISubjectAPIClient } from "./ISubjectAPIClient";
import { ISubjectDashboardAPIClient } from "./ISubjectDashboardAPIClient";
import { ISubjectAssignmentAPIClient } from "./ISubjectAssignmentAPIClient";
import { ISubjectMaterialAPIClient } from "./ISubjectMaterialAPIClient";
import { IUserAPIClient } from "./IUserAPIClient";
import { NotificationAPIClient } from "./NotificationAPIClient";
import { ScheduleAPIClient } from "./ScheduleAPIClient";
import { SessionAPIClient } from "./SessionAPIClient";
import { SubjectAPIClient } from "./SubjectAPIClient";
import { SubjectAssignmentAPIClient } from "./SubjectAssignmentAPIClient";
import { SubjectDashboardAPIClient } from "./SubjectDashboardAPIClient";
import { SubjectMaterialAPIClient } from "./SubjectMaterialAPIClient";
import { UserAPIClient } from "./UserAPIClient";

/**
 * Server-side factory to retrieve an {@link IAuthAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link IAuthAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IAuthAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerAuthApiClient(
    locale?: Locale,
): Promise<IAuthAPIClient> {
    return initializeClient(AuthAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link IClassAPIClient}.
 *
 * @param locale The locale to initialize the {@link IClassAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IClassAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerClassApiClient(
    locale?: Locale,
): Promise<IClassAPIClient> {
    return initializeClient(ClassAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link IClassStudentAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link IClassStudentAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IClassStudentAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerClassStudentApiClient(
    locale?: Locale,
): Promise<IClassStudentAPIClient> {
    return initializeClient(ClassStudentAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link IClassSubjectAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link IClassSubjectAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IClassSubjectAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerClassSubjectApiClient(
    locale?: Locale,
): Promise<IClassSubjectAPIClient> {
    return initializeClient(ClassSubjectAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link INotificationAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link INotificationAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link INotificationAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerNotificationApiClient(
    locale?: Locale,
): Promise<INotificationAPIClient> {
    return initializeClient(NotificationAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link IScheduleAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link IScheduleAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IScheduleAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerScheduleApiClient(
    locale?: Locale,
): Promise<IScheduleAPIClient> {
    return initializeClient(ScheduleAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link ISessionAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link ISessionAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link ISessionAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerSessionApiClient(
    locale?: Locale,
): Promise<ISessionAPIClient> {
    return initializeClient(SessionAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link ISubjectAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link ISubjectAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link ISubjectAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerSubjectApiClient(
    locale?: Locale,
): Promise<ISubjectAPIClient> {
    return initializeClient(SubjectAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link ISubjectDashboardAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link ISubjectDashboardAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link ISubjectDashboardAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerSubjectDashboardApiClient(
    locale?: Locale,
): Promise<ISubjectDashboardAPIClient> {
    return initializeClient(SubjectDashboardAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link ISubjectAssignmentAPIClient}.
 *
 * @param locale Optional locale to initialize the client with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link ISubjectAssignmentAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerSubjectAssignmentApiClient(
    locale?: Locale,
): Promise<ISubjectAssignmentAPIClient> {
    return initializeClient(SubjectAssignmentAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link ISubjectMaterialAPIClient}.
 *
 * @param locale Optional locale to initialize the client with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link ISubjectMaterialAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerSubjectMaterialApiClient(
    locale?: Locale,
): Promise<ISubjectMaterialAPIClient> {
    return initializeClient(SubjectMaterialAPIClient, locale);
}

/**
 * Server-side factory to retrieve an {@link IUserAPIClient}.
 *
 * @param locale Optional locale to initialize the {@link IUserAPIClient} with. If not provided, it will be
 * retrieved using {@link getLocale}.
 * @returns An {@link IUserAPIClient} initialized with the specified or retrieved locale.
 */
export async function getServerUserApiClient(
    locale?: Locale,
): Promise<IUserAPIClient> {
    return initializeClient(UserAPIClient, locale);
}

async function initializeClient<T extends APIClient>(
    constructor: new (locale?: Locale) => T,
    locale?: Locale,
): Promise<T> {
    return new constructor(locale ?? (await getLocale()));
}
