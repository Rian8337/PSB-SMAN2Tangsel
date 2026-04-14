"use client";

import { APIError } from "@/api";
import { useClassSubjectApiClient } from "@/providers/api/class-subject-api-provider";
import { useScheduleApiClient } from "@/providers/api/schedule-api-provider";
import { Input, NativeSelect } from "@chakra-ui/react";
import { Class, ScheduleDay } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { SubmitEvent, useCallback, useState } from "react";
import { AsyncSelect, AsyncSelectOption } from "../ui/AsyncSelect";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";
import { createDateFromTime } from "@/utils/schedule";

export interface CreateScheduleModalProps {
    readonly clazz: Class;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function CreateScheduleModal({
    clazz,
    isOpen,
    onClose,
    onSuccess,
}: CreateScheduleModalProps) {
    const formT = useTranslations("Form");
    const dayT = useTranslations("Day");
    const t = useTranslations("ClassScheduleManagement");

    const scheduleApiClient = useScheduleApiClient();
    const classSubjectApiClient = useClassSubjectApiClient();

    const [selectedClassSubject, setSelectedClassSubject] =
        useState<AsyncSelectOption | null>(null);

    const [day, setDay] = useState(ScheduleDay.monday);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedClassSubject(null);
        setDay(ScheduleDay.monday);
        setStartTime("");
        setEndTime("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const fetchClassSubjects = useCallback(
        async (query: string, signal?: AbortSignal) => {
            const classSubjects =
                await classSubjectApiClient.listAssignedSubjects(
                    clazz.id,
                    query,
                    10,
                    undefined,
                    signal,
                );

            return classSubjects.map(
                (cs) =>
                    ({
                        value: cs.id,
                        label: `${cs.subject.code} - ${cs.subject.name}`,
                    }) satisfies AsyncSelectOption,
            );
        },
        [classSubjectApiClient, clazz.id],
    );

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedClassSubject || !startTime || !endTime) {
            setError(formT("missingFields"));
            return;
        }

        const parsedSubjectId = parseInt(
            selectedClassSubject.value.toString(),
            10,
        );

        if (Number.isNaN(parsedSubjectId) || parsedSubjectId <= 0) {
            setError(t("validation.selectSubject"));
            return;
        }

        const startDate = createDateFromTime(startTime);
        const endDate = createDateFromTime(endTime);

        if (startDate >= endDate) {
            setError(formT("invalidDateRange"));
            return;
        }

        setIsLoading(true);

        scheduleApiClient
            .createSchedule({
                classSubjectId: parsedSubjectId,
                day,
                startTime: startDate,
                endTime: endDate,
            })
            .then(() => {
                toaster.create({
                    title: t("create.toast.successTitle"),
                    description: t("create.toast.successMessage", {
                        class: clazz.name,
                        subject: selectedClassSubject.label,
                    }),
                    type: "success",
                });

                onSuccess();
                handleClose();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError
                        ? e.message
                        : t("create.toast.errorMessage"),
                );

                toaster.create({
                    title: t("create.toast.errorTitle"),
                    description: t("create.toast.errorMessage"),
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
            title={t("create.title", { class: clazz.name })}
            formId="create-schedule-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("create.submitButton")}
            cancelLabel={t("create.cancelButton")}
        >
            <FormField label={t("fields.subject.label")}>
                <AsyncSelect
                    placeholder={t("fields.subject.placeholder")}
                    value={selectedClassSubject}
                    onChange={setSelectedClassSubject}
                    fetchOptions={fetchClassSubjects}
                />
            </FormField>

            <FormField label={t("fields.day.label")}>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        name="day"
                        value={day.toString()}
                        onChange={(e) => {
                            setDay(parseInt(e.target.value, 10) as ScheduleDay);
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
        </FormDialog>
    );
}
