import { Locale } from "next-intl";
import { getLocale } from "next-intl/server";
import { AuthAPIClient } from "./AuthAPIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";
import { IScheduleAPIClient } from "./IScheduleAPIClient";
import { ScheduleAPIClient } from "./ScheduleAPIClient";

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
