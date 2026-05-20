import { getServerAuthApiClient } from "@/api/server";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { unauthorized } from "next/navigation";

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
    const user = await authApiClient.getMe();

    if (!user) {
        unauthorized();
    }

    return (
        <DashboardClientView name={user.name.split(" ")[0]} role={user.role} />
    );
}
