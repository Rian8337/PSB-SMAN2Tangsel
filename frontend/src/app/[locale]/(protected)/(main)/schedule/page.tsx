import {
    getServerAuthApiClient,
    getServerSessionApiClient,
} from "@/api/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { encodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

export default async function MyScheduleRedirectPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.Administrator) {
        notFound();
    }

    const sessionApiClient = await getServerSessionApiClient();
    const active = await sessionApiClient.getActive().catch(() => null);

    if (!active) {
        notFound();
    }

    redirect({
        href: `/${encodeSessionCode(active.session, active.semester)}/schedule`,
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
    });
}
