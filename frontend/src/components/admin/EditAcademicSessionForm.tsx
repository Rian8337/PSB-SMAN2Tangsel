"use client";

import { APIError } from "@/api";
import { useRouter } from "@/i18n/navigation";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { Input } from "@chakra-ui/react";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "../ui/FormField";
import { PageForm } from "../ui/PageForm";
import { Switch } from "../ui/switch";
import { toaster } from "../ui/toaster";

export interface EditAcademicSessionFormProps {
    readonly session: AcademicSessionDTO;
}

export function EditAcademicSessionForm({
    session,
}: EditAcademicSessionFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("EditAcademicSession");
    const sessionApiClient = useSessionApiClient();
    const router = useRouter();

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");

        return `${year.toString()}-${month}-${day}`;
    };

    const [startTime, setStartTime] = useState(formatDate(session.startTime));
    const [endTime, setEndTime] = useState(formatDate(session.endTime));
    const [isActive, setIsActive] = useState(session.active);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!startTime || !endTime) {
            setError(formT("missingFields"));
            return;
        }

        const startTimestamp = new Date(startTime).getTime();
        const endTimestamp = new Date(endTime).getTime();

        if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
            setError(formT("invalidDate"));
            return;
        }

        if (startTimestamp >= endTimestamp) {
            setError(formT("invalidDateRange"));
            return;
        }

        setIsLoading(true);

        sessionApiClient
            .updateSession(
                session.session,
                session.semester,
                startTimestamp,
                endTimestamp,
                isActive,
            )
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", {
                        session: session.session,
                        semester: session.semester.toString(),
                    }),
                    type: "success",
                });

                router.push("/admin/academic-years");
                router.refresh();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError ? e.message : t("toast.errorMessage"),
                );

                toaster.create({
                    title: t("toast.errorTitle"),
                    description: t("toast.errorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <PageForm
            title={t("title")}
            backButtonUrl="/admin/academic-years"
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            submitLabel={t("updateButton")}
            showSessionSwitcher={false}
        >
            <FormField label={t("fields.session.label")}>
                <Input
                    name="session"
                    value={`${session.session} - ${t("fields.semester.label")} ${session.semester.toString()}`}
                    readOnly
                    disabled
                    bg="gray.200"
                    border="none"
                    borderRadius="sm"
                    color="gray.500"
                    cursor="not-allowed"
                />
            </FormField>

            <FormField label={t("fields.startDate.label")}>
                <Input
                    name="startTime"
                    type="date"
                    value={startTime}
                    bg="gray.200"
                    border="none"
                    borderRadius="sm"
                    onChange={(e) => {
                        setStartTime(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.endDate.label")}>
                <Input
                    name="endTime"
                    type="date"
                    value={endTime}
                    bg="gray.200"
                    border="none"
                    borderRadius="sm"
                    onChange={(e) => {
                        setEndTime(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.active.label")}>
                <Switch
                    name="active"
                    colorPalette="blue"
                    checked={isActive}
                    onCheckedChange={(e) => {
                        setIsActive(e.checked);
                    }}
                />
            </FormField>
        </PageForm>
    );
}
