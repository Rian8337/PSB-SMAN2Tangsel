import { getServerClassApiClient } from "@/api/server";
import { ClassScheduleManagement } from "@/components/admin/ClassScheduleManagement";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface ClassScheduleManagementPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
    params,
}: ClassScheduleManagementPageProps) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "ClassScheduleManagement",
    });

    return { title: t("metaTitle") };
}

export default async function ClassScheduleManagementPage({
    params,
}: ClassScheduleManagementPageProps) {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (Number.isNaN(id)) {
        notFound();
    }

    const classApiClient = await getServerClassApiClient();
    const clazz = await classApiClient.getClass(id).catch(() => null);

    if (!clazz) {
        notFound();
    }

    return <ClassScheduleManagement clazz={clazz} />;
}
