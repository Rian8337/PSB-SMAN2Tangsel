"use client";

import { BarChart3, BookOpen, Calendar, Home, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { BaseShell, NavItem } from "./BaseShell";

export function DashboardShell({ children }: PropsWithChildren) {
    const t = useTranslations("DashboardShell");

    const navItems: NavItem[] = [
        { label: t("home"), icon: Home, href: "/dashboard", exact: true },
        {
            label: t("schedule"),
            icon: Calendar,
            href: "/schedule",
            exact: false,
        },
        {
            label: t("subjects"),
            icon: BookOpen,
            href: "/subjects",
            exact: false,
        },
        {
            label: t("bookmarks"),
            icon: Star,
            href: "/bookmarks",
            exact: false,
        },
        {
            label: t("analytics"),
            icon: BarChart3,
            href: "/analytics",
            exact: false,
        },
    ];

    return (
        <BaseShell
            navItems={navItems}
            mobileTitle={t("mobileTitle")}
            settingsHref="/settings"
        >
            {children}
        </BaseShell>
    );
}
