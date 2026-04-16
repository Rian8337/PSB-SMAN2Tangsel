import { getServerClassApiClient } from "@/api/server";
import { ClassStudentManagement } from "@/components/admin/ClassStudentManagement";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface ClassStudentManagementPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
    params,
}: ClassStudentManagementPageProps) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "ClassStudentManagement",
    });

    return { title: t("metaTitle") };
}

export default async function ClassStudentManagementPage({
    params,
}: ClassStudentManagementPageProps) {
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

    return <ClassStudentManagement clazz={clazz} />;
}
