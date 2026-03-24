import { AccountManagement } from "@/components/admin/AccountManagement";
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

export default function AdminUsersPage() {
    return <AccountManagement />;
}
