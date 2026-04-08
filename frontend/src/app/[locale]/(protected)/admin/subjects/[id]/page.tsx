import { getServerSubjectApiClient } from "@/api/server";
import { EditSubjectForm } from "@/components/admin/EditSubjectForm";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface EditSubjectPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: EditSubjectPageProps) {
    const { locale } = await params;
    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "SubjectManagement.edit",
    });

    return { title: t("title") };
}

export default async function EditSubjectPage({
    params,
}: EditSubjectPageProps) {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (Number.isNaN(id)) {
        notFound();
    }

    const subjectApiClient = await getServerSubjectApiClient();
    const subject = await subjectApiClient.getSubject(id).catch(() => null);

    if (!subject) {
        notFound();
    }

    return <EditSubjectForm subject={subject} />;
}
