import { getServerAuthApiClient } from "@/api/server";
import { AccountManagement } from "@/components/admin/AccountManagement";
import { redirect } from "@/i18n/navigation";
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
        namespace: "AccountManagement",
    });

    return { title: t("title") };
}

export default async function AdminUsersPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user) {
        redirect({
            href: "/login",
            locale: hasLocale(routing.locales, locale)
                ? locale
                : routing.defaultLocale,
        });

        return;
    }

    return <AccountManagement currentUserId={user.id} />;
}
