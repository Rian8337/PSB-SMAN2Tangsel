import {
    getServerAuthApiClient,
    getServerScheduleApiClient,
} from "@/api/server";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
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
        namespace: "Dashboard",
    });

    return { title: t("title") };
}

export default async function DashboardPage() {
    const authApiClient = await getServerAuthApiClient();
    const scheduleApiClient = await getServerScheduleApiClient();

    const [user, schedules] = await Promise.all([
        authApiClient.getMe(),
        scheduleApiClient.getSchedule(),
    ]);

    const firstName = user?.name.split(" ")[0] ?? "Student";

    return <DashboardClientView name={firstName} schedules={schedules} />;
}
