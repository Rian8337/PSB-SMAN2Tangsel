"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Locale, useLocale } from "next-intl";
import { Button, HStack } from "@chakra-ui/react";

export default function LocaleSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    function switchLocale(locale: Locale) {
        router.replace(pathname, { locale });
    }

    return (
        <HStack gap={2}>
            {routing.locales.map((l) => (
                <Button
                    key={l}
                    onClick={() => {
                        switchLocale(l);
                    }}
                    disabled={l === locale}
                    size="sm"
                    variant={l === locale ? "solid" : "outline"}
                >
                    {l.toUpperCase()}
                </Button>
            ))}
        </HStack>
    );
}
