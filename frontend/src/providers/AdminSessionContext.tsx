"use client";

import { APIError } from "@/api";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
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

                // 404 means no active session, so we leave selectedSession as null.
                if (!(e instanceof APIError && e.code === 404)) {
                    throw e;
                }
            })
            .finally(() => {
                setIsLoadingSession(false);
            });

        return () => {
            controller.abort();
        };
    }, [sessionApiClient]);

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
