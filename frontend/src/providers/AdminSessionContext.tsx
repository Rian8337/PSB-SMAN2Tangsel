"use client";

import { APIError } from "@/api";
import { toaster } from "@/components/ui/toaster";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { createContext, use, useEffect, useState } from "react";

interface AdminSessionContextValue {
    selectedSession: AcademicSessionDTO | null;
    isLoadingSession: boolean;
    setSelectedSession: (session: AcademicSessionDTO) => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
    null,
);

export function AdminSessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations("AdminSessionProvider");
    const sessionApiClient = useSessionApiClient();

    const [selectedSession, setSelectedSession] =
        useState<AcademicSessionDTO | null>(null);

    const [isLoadingSession, setIsLoadingSession] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        sessionApiClient
            .getActive(controller.signal)
            .then((session) => {
                setSelectedSession(session);
            })
            .catch((e: unknown) => {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                // 404 means no active session; leave selectedSession as null silently.
                if (e instanceof APIError && e.code === 404) {
                    return;
                }

                toaster.create({
                    title: t("fetchSessionToast.errorTitle"),
                    description: t("fetchSessionToast.errorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsLoadingSession(false);
            });

        return () => {
            controller.abort();
        };
    }, [sessionApiClient, t]);

    return (
        <AdminSessionContext
            value={{ selectedSession, isLoadingSession, setSelectedSession }}
        >
            {children}
        </AdminSessionContext>
    );
}

export function useAdminSession(): AdminSessionContextValue | null {
    return use(AdminSessionContext);
}
