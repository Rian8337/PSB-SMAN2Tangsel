"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function LocaleSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
            {routing.locales.map((l) => (
                <button
                    key={l}
                    onClick={() => {
                        router.replace(pathname, { locale: l });
                    }}
                    disabled={l === locale}
                    style={{ marginRight: "8px", padding: "4px 8px" }}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
