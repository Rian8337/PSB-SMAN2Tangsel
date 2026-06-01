"use client";

import { useSessionCode } from "@/hooks";
import { useRouter } from "@/i18n/navigation";
import { useAuthApiClient } from "@/providers/api/auth-api-provider";
import { encodeSessionCode } from "@/utils/sessionCode";
import { NativeSelect } from "@chakra-ui/react";
import { UserSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function SessionSwitcher() {
    const t = useTranslations("SessionSwitcher");
    const authApiClient = useAuthApiClient();
    const router = useRouter();
    const currentSessionCode = useSessionCode();

    const [sessions, setSessions] = useState<UserSessionDTO[]>([]);

    useEffect(() => {
        const controller = new AbortController();

        authApiClient
            .getMySessions(controller.signal)
            .then((data) => {
                setSessions(data);
            })
            .catch(() => {
                // Non-critical, so we silently ignore errors.
            });

        return () => {
            controller.abort();
        };
    }, [authApiClient]);

    if (sessions.length === 0) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;

        if (code && code !== currentSessionCode) {
            router.push(`/${code}/dashboard`);
        }
    };

    return (
        <NativeSelect.Root size="sm" bg="white" borderRadius="md">
            <NativeSelect.Field
                value={currentSessionCode}
                onChange={handleChange}
                aria-label={t("label")}
                cursor="pointer"
            >
                {sessions.map((s) => {
                    const code = encodeSessionCode(s.session, s.semester);

                    return (
                        <option key={code} value={code}>
                            {s.session} - {t("semester")}{" "}
                            {s.semester.toString()}
                        </option>
                    );
                })}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
}
