"use client";

import { APIError } from "@/api";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import {
    Button,
    Dialog,
    Field,
    Input,
    NativeSelect,
    VStack,
} from "@chakra-ui/react";
import { ValidSemester, ValidSession } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toaster } from "../ui/toaster";
import { Switch } from "../ui/switch";

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
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open) {
                    handleClose();
                }
            }}
            placement="center"
        >
            <Dialog.Backdrop />

            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>{t("dialog.title")}</Dialog.Title>
                </Dialog.Header>

                <Dialog.Body>
                    <VStack
                        as="form"
                        id="create-session-form"
                        spaceY={4}
                        onSubmit={handleSubmit}
                        align="stretch"
                    >
                        {error && (
                            <Dialog.Description
                                color="red.500"
                                fontSize="sm"
                                fontWeight="medium"
                            >
                                {error}
                            </Dialog.Description>
                        )}

                        <Field.Root>
                            <Field.Label>
                                {t("dialog.session.label")}
                            </Field.Label>

                            <Input
                                name="session"
                                value={session}
                                onChange={(e) => {
                                    setSession(e.target.value as ValidSession);
                                }}
                                placeholder={t("dialog.session.placeholder")}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>
                                {t("dialog.semester.label")}
                            </Field.Label>

                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    name="semester"
                                    value={semester}
                                    onChange={(e) => {
                                        setSemester(
                                            parseInt(
                                                e.target.value,
                                                10,
                                            ) as ValidSemester,
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
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>
                                {t("dialog.startDate.label")}
                            </Field.Label>

                            <Input
                                name="startTime"
                                type="date"
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(e.target.value);
                                }}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>
                                {t("dialog.endDate.label")}
                            </Field.Label>

                            <Input
                                name="endTime"
                                type="date"
                                value={endTime}
                                onChange={(e) => {
                                    setEndTime(e.target.value);
                                }}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>{t("dialog.activeLabel")}</Field.Label>

                            <Switch
                                name="active"
                                colorPalette="blue"
                                checked={isActive}
                                onCheckedChange={(e) => {
                                    setIsActive(e.checked);
                                }}
                            />
                        </Field.Root>
                    </VStack>
                </Dialog.Body>

                <Dialog.Footer>
                    <Button variant="outline" onClick={handleClose} mr={3}>
                        {t("dialog.cancelButton")}
                    </Button>

                    <Button
                        type="submit"
                        form="create-session-form"
                        colorPalette="blue"
                        loading={isLoading}
                    >
                        {t("dialog.submitButton")}
                    </Button>
                </Dialog.Footer>

                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    );
}
