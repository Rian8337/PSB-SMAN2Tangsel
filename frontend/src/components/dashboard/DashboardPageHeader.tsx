import { useTranslations } from "next-intl";
import { PageHeader } from "../layout/PageHeader";

interface DashboardPageHeaderProps {
    name: string;
}

export function DashboardPageHeader({ name }: DashboardPageHeaderProps) {
    const t = useTranslations("DashboardPageHeader");

    return <PageHeader title={t("welcome", { name })} />;
}
