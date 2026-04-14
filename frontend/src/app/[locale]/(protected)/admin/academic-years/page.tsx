import { AcademicSessionManagement } from "@/components/admin/AcademicSessionManagement";
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
        namespace: "AcademicSession",
    });

    return { title: t("title") };
}

export default function AcademicYearPage() {
    return <AcademicSessionManagement />;
}
