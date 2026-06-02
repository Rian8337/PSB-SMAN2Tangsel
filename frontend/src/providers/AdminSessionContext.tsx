"use client";

import { APIError } from "@/api";
import { toaster } from "@/components/ui/toaster";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { createContext, use, useEffect, useState } from "react";

/**
 * Context for managing the currently selected academic session in the admin interface. This allows
 * admins to switch between sessions without having to set a session as active.
 */
interface AdminSessionContextValue {
    /**
     * The currently selected academic session. `null` if there is no active session or
     * the session failed to load.
     */
    selectedSession: AcademicSessionDTO | null;

    /**
     * Whether the session is currently being loaded.
     */
    isLoadingSession: boolean;

    /**
     * Sets the currently selected session.
     *
     * @param session The session to select.
     */
    setSelectedSession: (session: AcademicSessionDTO) => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
    null,
);

/**
 * Provider component for the {@link AdminSessionContext}.
 */
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

/**
 * Hook to access the {@link AdminSessionContext}. Must be used within an {@link AdminSessionProvider}.
 */
export function useAdminSession(): AdminSessionContextValue | null {
    return use(AdminSessionContext);
}
