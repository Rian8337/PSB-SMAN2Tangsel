import { getServerUserApiClient } from "@/api/server";
import { EditUserForm } from "@/components/admin/EditUserForm";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface EditUserPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: EditUserPageProps) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "EditUser",
    });

    return { title: t("title") };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
    const { id } = await params;
    const userApiClient = await getServerUserApiClient();
    const userId = parseInt(id, 10);

    if (Number.isNaN(userId)) {
        notFound();
    }

    const user = await userApiClient.getUser(userId);

    return <EditUserForm user={user} />;
}
