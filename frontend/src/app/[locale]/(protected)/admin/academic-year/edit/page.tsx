import { getServerSessionApiClient } from "@/api/server";
import { EditAcademicSessionForm } from "@/components/admin/EditAcademicSessionForm";
import { routing } from "@/i18n/routing";
import { validSemesterSchema, validSessionSchema } from "@psb/shared/validator";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface EditAcademicYearPageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        session?: string;
        semester?: string;
    }>;
}

export async function generateMetadata({ params }: EditAcademicYearPageProps) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "EditAcademicSession",
    });

    return { title: t("title") };
}

export default async function EditAcademicYearPage({
    searchParams,
}: EditAcademicYearPageProps) {
    const { session, semester } = await searchParams;

    if (!session || !semester) {
        notFound();
    }

    const parsedSession = validSessionSchema.safeParse(
        decodeURIComponent(session),
    );

    if (!parsedSession.success) {
        notFound();
    }

    const parsedSemester = validSemesterSchema.safeParse(
        parseInt(semester, 10),
    );

    if (!parsedSemester.success) {
        notFound();
    }

    const sessionApiClient = await getServerSessionApiClient();

    const academicSession = await sessionApiClient.getSession(
        parsedSession.data,
        parsedSemester.data,
    );

    if (!academicSession) {
        notFound();
    }

    return <EditAcademicSessionForm session={academicSession} />;
}
