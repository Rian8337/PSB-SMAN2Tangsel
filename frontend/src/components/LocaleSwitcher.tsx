"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { IconButton, Menu } from "@chakra-ui/react";
import { Globe } from "lucide-react";
import { Locale, useLocale } from "next-intl";

const localeLabels: Record<string, string> = {
    id: "Bahasa Indonesia",
    en: "English",
};

type MenuPlacement =
    | "top"
    | "top-start"
    | "top-end"
    | "right"
    | "right-start"
    | "right-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end";

interface LocaleSwitcherProps {
    menuPlacement?: MenuPlacement;
}

export default function LocaleSwitcher({
    menuPlacement = "bottom-start",
}: LocaleSwitcherProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    function switchLocale(next: Locale) {
        router.replace(pathname, { locale: next });
    }

    return (
        <Menu.Root
            positioning={{ placement: menuPlacement, offset: { mainAxis: 20 } }}
        >
            <Menu.Trigger asChild>
                <IconButton
                    aria-label="Change Language"
                    variant="ghost"
                    _hover={{ bg: "blackAlpha.200" }}
                    cursor="pointer"
                >
                    <Globe size={28} color="black" />
                </IconButton>
            </Menu.Trigger>

            <Menu.Positioner zIndex={1500}>
                <Menu.Content minW="160px">
                    {routing.locales.map((l) => (
                        <Menu.Item
                            key={l}
                            value={l}
                            onClick={() => {
                                switchLocale(l);
                            }}
                            fontWeight={l === locale ? "bold" : "normal"}
                            cursor="pointer"
                        >
                            {localeLabels[l] ?? l.toUpperCase()}
                        </Menu.Item>
                    ))}
                </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
}
