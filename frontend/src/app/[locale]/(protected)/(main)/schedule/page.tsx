import { getServerScheduleApiClient } from "@/api/server";
import { MyScheduleClientView } from "@/components/schedule/MyScheduleClientView";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
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

export default async function MySchedulePage() {
    const scheduleApiClient = await getServerScheduleApiClient();
    const schedules = await scheduleApiClient.getSchedule();

    return <MyScheduleClientView schedules={schedules} />;
}
