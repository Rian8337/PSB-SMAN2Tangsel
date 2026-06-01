import {
    getServerAuthApiClient,
    getServerScheduleApiClient,
} from "@/api/server";
import { MySchedule } from "@/components/schedule/MySchedule";
import { routing } from "@/i18n/routing";
import { decodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; sessionCode: string }>;
}) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "MySchedule",
    });

    return { title: t("title") };
}

export default async function SchedulePage({
    params,
}: {
    params: Promise<{ sessionCode: string }>;
}) {
    const { sessionCode } = await params;
    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.administrator) {
        notFound();
    }

    const scheduleApiClient = await getServerScheduleApiClient();

    const schedules = await scheduleApiClient
        .getSchedule(decoded.session, decoded.semester)
        .catch(() => []);

    return <MySchedule schedules={schedules} />;
}
