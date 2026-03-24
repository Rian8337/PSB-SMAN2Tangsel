"use client";

import { Book, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";
import { BaseShell, NavItem } from "./BaseShell";

export function DashboardShell({ children }: PropsWithChildren) {
    const t = useTranslations("DashboardShell");

    const navItems: NavItem[] = [
        { label: t("home"), icon: Home, href: "/dashboard", exact: true },
        { label: t("schedule"), icon: Book, href: "/schedule", exact: false },
    ];

    return (
        <BaseShell
            navItems={navItems}
            mobileTitle={t("mobileTitle")}
            userName="Reza"
            userAvatar="/pas-foto.jpg"
            settingsHref="/settings"
        >
            {children}
        </BaseShell>
    );
}
