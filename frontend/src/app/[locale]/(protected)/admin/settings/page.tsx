import { AccountSettings } from "@/components/settings/AccountSettings";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params: { locale },
}: {
    params: { locale: Locale };
}) {
    const t = await getTranslations({ locale, namespace: "AccountSettings" });

    return { title: t("title") };
}

export default function AdminSettingsPage() {
    return <AccountSettings />;
}
