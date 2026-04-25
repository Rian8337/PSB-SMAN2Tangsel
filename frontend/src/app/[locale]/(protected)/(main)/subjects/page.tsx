import { MySubjects } from "@/components/subjects/MySubjects";
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
        namespace: "Subjects",
    });

    return { title: t("title") };
}

export default function MySubjectsPage() {
    return <MySubjects />;
}
