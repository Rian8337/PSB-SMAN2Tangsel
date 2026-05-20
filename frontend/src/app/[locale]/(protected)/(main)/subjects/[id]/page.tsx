import { getServerAuthApiClient } from "@/api/server";
import { SubjectDashboard } from "@/components/subjects/SubjectDashboard";
import { routing } from "@/i18n/routing";
import { UserRole } from "@psb/shared/types";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "SubjectDashboard",
    });

    return { title: t("materials") };
}

export default async function SubjectDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const classSubjectId = parseInt(id, 10);

    if (isNaN(classSubjectId) || classSubjectId <= 0) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.administrator) {
        notFound();
    }

    return (
        <SubjectDashboard classSubjectId={classSubjectId} role={user.role} />
    );
}
