"use client";

import { useSessionCode } from "@/hooks";
import { useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/providers/AdminSessionContext";
import { useAuthApiClient } from "@/providers/api/auth-api-provider";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { encodeSessionCode } from "@/utils/sessionCode";
import { Button, Menu } from "@chakra-ui/react";
import {
    AcademicSessionDTO,
    UserSessionDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function abbreviateSession(session: string, semester: number): string {
    const [start, end] = session.split("/");
    return `${start.slice(-2)}/${end.slice(-2)} · S${semester.toString()}`;
}

export function SessionSwitcher() {
    const t = useTranslations("SessionSwitcher");
    const authApiClient = useAuthApiClient();
    const sessionApiClient = useSessionApiClient();
    const router = useRouter();
    const currentSessionCode = useSessionCode();
    const adminSession = useAdminSession();

    const isAdmin = adminSession !== null;

    const [userSessions, setUserSessions] = useState<UserSessionDTO[]>([]);
    const [adminSessions, setAdminSessions] = useState<AcademicSessionDTO[]>(
        [],
    );

    useEffect(() => {
        if (isAdmin) {
            return;
        }

        const controller = new AbortController();

        authApiClient
            .getMySessions(controller.signal)
            .then(setUserSessions)
            .catch(() => {
                // Non-critical, so we silently ignore errors.
            });

        return () => {
            controller.abort();
        };
    }, [isAdmin, authApiClient]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const controller = new AbortController();

        sessionApiClient
            .listSessions(undefined, undefined, undefined, controller.signal)
            .then(setAdminSessions)
            .catch(() => {
                // Non-critical, so we silently ignore errors.
            });

        return () => {
            controller.abort();
        };
    }, [isAdmin, sessionApiClient]);

    const sessions: UserSessionDTO[] = isAdmin ? adminSessions : userSessions;

    const currentCode = isAdmin
        ? adminSession.selectedSession
            ? encodeSessionCode(
                  adminSession.selectedSession.session,
                  adminSession.selectedSession.semester,
              )
            : null
        : currentSessionCode;

    if (sessions.length === 0) {
        return null;
    }

    const current = sessions.find(
        (s) => encodeSessionCode(s.session, s.semester) === currentCode,
    );

    const handleSelect = (s: {
        session: ValidSession;
        semester: ValidSemester;
    }) => {
        const code = encodeSessionCode(s.session, s.semester);

        if (isAdmin) {
            adminSession.setSelectedSession(s as AcademicSessionDTO);
        } else if (code !== currentSessionCode) {
            router.push(`/${code}/dashboard`);
        }
    };

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
                        : (currentCode ?? "...")}
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
                                    code === currentCode ? "bold" : "normal"
                                }
                                cursor="pointer"
                                onClick={() => {
                                    handleSelect(s);
                                }}
                            >
                                {s.session} - {t("semester")}{" "}
                                {s.semester.toString()}
                            </Menu.Item>
                        );
                    })}
                </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
}
