import { getServerAuthApiClient } from "@/api/server";
import { AdminDashboardClientView } from "@/components/dashboard/AdminDashboardClientView";
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
        namespace: "AdminDashboard",
    });

    return { title: t("title") };
}

export default async function AdminDashboardPage() {
    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    const firstName = user?.name.split(" ")[0] ?? "Admin";

    return <AdminDashboardClientView name={firstName} />;
}
