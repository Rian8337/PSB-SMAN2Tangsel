import { getServerSubjectApiClient } from "@/api/server";
import { EditSubjectForm } from "@/components/admin/EditSubjectForm";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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
        namespace: "SubjectManagement.edit",
    });

    return { title: t("title") };
}

export default async function EditSubjectPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string }>;
}) {
    const { id: idParam } = await searchParams;
    const id = parseInt(idParam ?? "", 10);
    const subjectApiClient = await getServerSubjectApiClient();

    if (Number.isNaN(id)) {
        notFound();
    }

    const subject = await subjectApiClient.getSubject(id).catch(() => null);

    if (!subject) {
        notFound();
    }

    return <EditSubjectForm subject={subject} />;
}
