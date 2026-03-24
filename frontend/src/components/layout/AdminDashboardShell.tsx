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
            exact: false,
        },
        {
            label: t("academicYear"),
            icon: Calendar,
            href: "/admin/academic-year",
            exact: false,
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
