import { getServerClassApiClient } from "@/api/server";
import { EditClassForm } from "@/components/admin/EditClassForm";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface EditClassPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: EditClassPageProps) {
    const { locale } = await params;
    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "ClassManagement.edit",
    });

    return { title: t("title") };
}

export default async function EditClassPage({ params }: EditClassPageProps) {
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

    return <EditClassForm clazz={clazz} />;
}
