"use client";

import { APIError } from "@/api";
import { useScheduleApiClient } from "@/providers/api/schedule-api-provider";
import { Flex, Input, NativeSelect, Spinner } from "@chakra-ui/react";
import { ScheduleDay } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { SubmitEvent, useCallback, useEffect, useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";
import { createDateFromTime } from "@/utils/schedule";

export interface EditScheduleModalProps {
    readonly scheduleId: number;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

const formatTimeFromTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);

    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

export function EditScheduleModal({
    scheduleId,
    isOpen,
    onClose,
    onSuccess,
}: EditScheduleModalProps) {
    const formT = useTranslations("Form");
    const dayT = useTranslations("Day");
    const t = useTranslations("ClassScheduleManagement");
    const scheduleApiClient = useScheduleApiClient();

    const [subjectDisplay, setSubjectDisplay] = useState("");
    const [day, setDay] = useState(ScheduleDay.monday);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setError(null);
        setSubjectDisplay("");
        onClose();
    };

    const fetchSchedule = useCallback(
        async (signal?: AbortSignal) => {
            setIsFetching(true);
            setError(null);

            try {
                const schedule = await scheduleApiClient.getById(
                    scheduleId,
                    signal,
                );

                setSubjectDisplay(
                    `(${schedule.subject.code}) ${schedule.subject.name}`,
                );
                setDay(schedule.day);
                setStartTime(formatTimeFromTimestamp(schedule.startTime));
                setEndTime(formatTimeFromTimestamp(schedule.endTime));
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                setError(t("edit.fetchToast.errorMessage"));

                toaster.create({
                    title: t("edit.fetchToast.errorTitle"),
                    description: t("edit.fetchToast.errorMessage"),
                    type: "error",
                });
            } finally {
                if (!signal?.aborted) {
                    setIsFetching(false);
                }
            }
        },
        [scheduleApiClient, scheduleId, t],
    );

    useEffect(() => {
        if (!isOpen || !scheduleId) {
            return;
        }

        const controller = new AbortController();

        void fetchSchedule(controller.signal);

        return () => {
            controller.abort();
        };
    }, [isOpen, scheduleId, scheduleApiClient, t, fetchSchedule]);

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!startTime || !endTime) {
            setError(formT("missingFields"));
            return;
        }

        const startDate = createDateFromTime(startTime);
        const endDate = createDateFromTime(endTime);

        if (startDate >= endDate) {
            setError(formT("invalidDateRange"));
            return;
        }

        setIsSubmitting(true);

        scheduleApiClient
            .updateSchedule({
                id: scheduleId,
                day,
                startTime: startDate,
                endTime: endDate,
            })
            .then(() => {
                toaster.create({
                    title: t("edit.submitToast.successTitle"),
                    description: t("edit.submitToast.successMessage"),
                    type: "success",
                });

                onSuccess();
                handleClose();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError
                        ? e.message
                        : t("edit.submitToast.errorMessage"),
                );

                toaster.create({
                    title: t("edit.submitToast.errorTitle"),
                    description: t("edit.submitToast.errorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={handleClose}
            title={t("edit.title")}
            formId="edit-schedule-form"
            onSubmit={handleSubmit}
            isLoading={isSubmitting || isFetching}
            error={error}
            submitLabel={t("edit.submitButton")}
            cancelLabel={t("edit.cancelButton")}
        >
            {isFetching ? (
                <Flex justify="center" align="center" py={12}>
                    <Spinner size="xl" />
                </Flex>
            ) : (
                <>
                    <FormField label={t("fields.subject.label")}>
                        <Input
                            name="subject"
                            value={subjectDisplay}
                            readOnly
                            disabled
                            bg="gray.100"
                        />
                    </FormField>

                    <FormField label={t("fields.day.label")}>
                        <NativeSelect.Root>
                            <NativeSelect.Field
                                name="day"
                                value={day.toString()}
                                onChange={(e) => {
                                    setDay(
                                        parseInt(
                                            e.target.value,
                                            10,
                                        ) as ScheduleDay,
                                    );
                                }}
                            >
                                <option value={ScheduleDay.monday}>
                                    {dayT("monday")}
                                </option>

                                <option value={ScheduleDay.tuesday}>
                                    {dayT("tuesday")}
                                </option>

                                <option value={ScheduleDay.wednesday}>
                                    {dayT("wednesday")}
                                </option>

                                <option value={ScheduleDay.thursday}>
                                    {dayT("thursday")}
                                </option>

                                <option value={ScheduleDay.friday}>
                                    {dayT("friday")}
                                </option>
                            </NativeSelect.Field>
                        </NativeSelect.Root>
                    </FormField>

                    <FormField label={t("fields.startTime.label")}>
                        <Input
                            name="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                                setStartTime(e.target.value);
                            }}
                        />
                    </FormField>

                    <FormField label={t("fields.endTime.label")}>
                        <Input
                            name="endTime"
                            type="time"
                            value={endTime}
                            onChange={(e) => {
                                setEndTime(e.target.value);
                            }}
                        />
                    </FormField>
                </>
            )}
        </FormDialog>
    );
}
