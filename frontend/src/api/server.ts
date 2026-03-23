import { Locale } from "next-intl";
import { getLocale } from "next-intl/server";
import { AuthAPIClient } from "./AuthAPIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";
import { IScheduleAPIClient } from "./IScheduleAPIClient";
import { ScheduleAPIClient } from "./ScheduleAPIClient";
import { NotificationAPIClient } from "./NotificationAPIClient";
import { INotificationAPIClient } from "./INotificationAPIClient";
import { IUserAPIClient } from "./IUserAPIClient";
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
    return new AuthAPIClient(locale ?? (await getLocale()));
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
    return new NotificationAPIClient(locale ?? (await getLocale()));
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
    return new ScheduleAPIClient(locale ?? (await getLocale()));
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
    return new UserAPIClient(locale ?? (await getLocale()));
}
