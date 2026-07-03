"use client";

import { APIError } from "@/api";
import { toaster } from "@/components/ui/toaster";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import {
    createContext,
    use,
    useCallback,
    useEffect,
    useState,
    useTransition,
} from "react";

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

    /**
     * Re-fetches the currently active session from the server. Should be called after any
     * operation that may change which academic session is active (e.g., creating or updating
     * a semester), since the active session is only fetched once when this provider mounts.
     */
    refreshSession: () => void;
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

    const [isLoadingSession, startTransition] = useTransition();

    const fetchActiveSession = useCallback(
        (signal?: AbortSignal) =>
            sessionApiClient
                .getActive(signal)
                .then((session) => {
                    setSelectedSession(session);
                })
                .catch((e: unknown) => {
                    if (e instanceof Error && e.name === "AbortError") {
                        return;
                    }

                    // 404 means no active session.
                    if (e instanceof APIError && e.code === 404) {
                        setSelectedSession(null);
                        return;
                    }

                    toaster.create({
                        title: t("fetchSessionToast.errorTitle"),
                        description: t("fetchSessionToast.errorMessage"),
                        type: "error",
                    });
                }),
        [sessionApiClient, t],
    );

    useEffect(() => {
        const controller = new AbortController();

        startTransition(() => fetchActiveSession(controller.signal));

        return () => {
            controller.abort();
        };
    }, [fetchActiveSession]);

    return (
        <AdminSessionContext
            value={{
                selectedSession,
                isLoadingSession,
                setSelectedSession,
                refreshSession: () => {
                    startTransition(() => fetchActiveSession());
                },
            }}
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
