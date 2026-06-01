"use client";

import { useRouter } from "@/i18n/navigation";
import { useAuthApiClient } from "@/providers/api/auth-api-provider";
import { useSessionCode } from "@/hooks";
import { encodeSessionCode } from "@/utils/sessionCode";
import { UserSessionDTO } from "@psb/shared/types";
import { Button, Menu } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function abbreviateSession(session: string, semester: number): string {
    const [start, end] = session.split("/");
    return `${start.slice(-2)}/${end.slice(-2)} · S${semester.toString()}`;
}

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

    const current = sessions.find(
        (s) => encodeSessionCode(s.session, s.semester) === currentSessionCode,
    );

    return (
        <Menu.Root
            positioning={{ placement: "bottom-end", offset: { mainAxis: 4 } }}
        >
            <Menu.Trigger asChild>
                <Button
                    size="xs"
                    variant="outline"
                    bg="white"
                    _hover={{ bg: "blackAlpha.100" }}
                    aria-label={t("label")}
                >
                    {current
                        ? abbreviateSession(current.session, current.semester)
                        : currentSessionCode}
                </Button>
            </Menu.Trigger>

            <Menu.Positioner zIndex={1500}>
                <Menu.Content minW="180px">
                    {sessions.map((s) => {
                        const code = encodeSessionCode(s.session, s.semester);
                        return (
                            <Menu.Item
                                key={code}
                                value={code}
                                fontWeight={
                                    code === currentSessionCode
                                        ? "bold"
                                        : "normal"
                                }
                                cursor="pointer"
                                onClick={() => {
                                    if (code !== currentSessionCode) {
                                        router.push(`/${code}/dashboard`);
                                    }
                                }}
                            >
                                {s.session} – {t("semester")}{" "}
                                {s.semester.toString()}
                            </Menu.Item>
                        );
                    })}
                </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
}
