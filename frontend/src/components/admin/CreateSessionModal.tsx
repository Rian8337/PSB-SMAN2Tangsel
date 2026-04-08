"use client";

import { APIError } from "@/api";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { Input, NativeSelect } from "@chakra-ui/react";
import { ValidSemester, ValidSession } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { Switch } from "../ui/switch";
import { toaster } from "../ui/toaster";

export interface CreateSessionModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function CreateSessionModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateSessionModalProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("EditAcademicSession.create");
    const sessionApiClient = useSessionApiClient();

    const currentYear = new Date().getFullYear();
    const defaultSession =
        `${currentYear.toString()}/${(currentYear + 1).toString()}` as ValidSession;

    const [session, setSession] = useState(defaultSession);
    const [semester, setSemester] = useState<ValidSemester>(1);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isActive, setIsActive] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSession(defaultSession);
        setSemester(1);
        setStartTime("");
        setEndTime("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!session.trim() || !startTime || !endTime) {
            setError(formT("missingFields"));
            return;
        }

        if (!/^\d{4}\/\d{4}$/.test(session)) {
            setError(t("validation.invalidSessionFormat"));
            return;
        }

        const [startYear, endYear] = session.split("/").map(Number);

        if (endYear !== startYear + 1) {
            setError(t("validation.invalidSessionRange"));
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
            .createSession(
                session,
                semester,
                startTimestamp,
                endTimestamp,
                isActive,
            )
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", {
                        session,
                        semester: semester.toString(),
                    }),
                    type: "success",
                });

                onSuccess();
                handleClose();
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
        <FormDialog
            isOpen={isOpen}
            onClose={handleClose}
            title={t("dialog.title")}
            formId="create-session-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("dialog.submitButton")}
            cancelLabel={t("dialog.cancelButton")}
        >
            <FormField label={t("dialog.session.label")}>
                <Input
                    name="session"
                    value={session}
                    onChange={(e) => {
                        setSession(e.target.value as ValidSession);
                    }}
                    placeholder={t("dialog.session.placeholder")}
                />
            </FormField>

            <FormField label={t("dialog.semester.label")}>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        name="semester"
                        value={semester}
                        onChange={(e) => {
                            setSemester(
                                parseInt(e.target.value, 10) as ValidSemester,
                            );
                        }}
                    >
                        <option value="1">
                            {t("dialog.semester.options.odd")}
                        </option>

                        <option value="2">
                            {t("dialog.semester.options.even")}
                        </option>
                    </NativeSelect.Field>
                </NativeSelect.Root>
            </FormField>

            <FormField label={t("dialog.startDate.label")}>
                <Input
                    name="startTime"
                    type="date"
                    value={startTime}
                    onChange={(e) => {
                        setStartTime(e.target.value);
                    }}
                />
            </FormField>

            <FormField label={t("dialog.endDate.label")}>
                <Input
                    name="endTime"
                    type="date"
                    value={endTime}
                    onChange={(e) => {
                        setEndTime(e.target.value);
                    }}
                />
            </FormField>

            <FormField label={t("dialog.activeLabel")}>
                <Switch
                    name="active"
                    colorPalette="blue"
                    checked={isActive}
                    onCheckedChange={(e) => {
                        setIsActive(e.checked);
                    }}
                />
            </FormField>
        </FormDialog>
    );
}
