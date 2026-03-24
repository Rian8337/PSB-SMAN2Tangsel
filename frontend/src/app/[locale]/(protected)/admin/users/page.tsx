import { AccountManagement } from "@/components/admin/AccountManagement";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: { locale: Locale };
}) {
    const t = await getTranslations({
        locale: params.locale,
        namespace: "AccountManagement",
    });

    return { title: t("title") };
}

export default function AdminUsersPage() {
    return <AccountManagement />;
}
