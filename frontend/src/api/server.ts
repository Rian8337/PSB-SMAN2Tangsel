import { Locale } from "next-intl";
import { getLocale } from "next-intl/server";
import { AuthAPIClient } from "./AuthAPIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";
import { INotificationAPIClient } from "./INotificationAPIClient";
import { IScheduleAPIClient } from "./IScheduleAPIClient";
import { ISessionAPIClient } from "./ISessionAPIClient";
import { IUserAPIClient } from "./IUserAPIClient";
import { NotificationAPIClient } from "./NotificationAPIClient";
import { ScheduleAPIClient } from "./ScheduleAPIClient";
import { SessionAPIClient } from "./SessionAPIClient";
import { UserAPIClient } from "./UserAPIClient";
import { SubjectAPIClient } from "./SubjectAPIClient";
import { ISubjectAPIClient } from "./ISubjectAPIClient";
import { APIClient } from "./APIClient";

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
