"use client";

import { Calendar, Home, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { BaseShell, NavItem } from "./BaseShell";

export function AdminDashboardShell({ children }: PropsWithChildren) {
    const t = useTranslations("AdminDashboardShell");

    const navItems: NavItem[] = [
        { label: t("dashboard"), icon: Home, href: "/admin", exact: true },
        {
            label: t("accountManagement"),
            icon: Users,
            href: "/admin/users",
        },
        {
            label: t("academicYear"),
            icon: Calendar,
            href: "/admin/academic-year",
        },
        {
            label: t("subjectManagement"),
            icon: Calendar,
            href: "/admin/subjects",
        },
    ];

    return (
        <BaseShell
            navItems={navItems}
            mobileTitle={t("mobileTitle")}
            userName="Admin"
            userAvatar="/pas-foto.jpg"
            settingsHref="/admin/settings"
        >
            {children}
        </BaseShell>
    );
}
