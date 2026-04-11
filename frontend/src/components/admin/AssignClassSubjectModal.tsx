"use client";

import { APIError } from "@/api";
import { useClassApiClient } from "@/providers/api/class-api-provider";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import { Text } from "@chakra-ui/react";
import { Class } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { AsyncSelect, AsyncSelectOption } from "../ui/AsyncSelect";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";

export interface AssignClassSubjectModalProps {
    readonly isOpen: boolean;
    readonly clazz: Class;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function AssignClassSubjectModal({
    isOpen,
    clazz,
    onClose,
    onSuccess,
}: AssignClassSubjectModalProps) {
    const t = useTranslations("ClassSubjectManagement.assign");
    const classApiClient = useClassApiClient();
    const subjectApiClient = useSubjectApiClient();
    const userApiClient = useUserApiClient();

    const [selectedSubject, setSelectedSubject] =
        useState<AsyncSelectOption | null>(null);
    const [selectedTeacher, setSelectedTeacher] =
        useState<AsyncSelectOption | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedSubject(null);
        setSelectedTeacher(null);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const fetchUnassignedSubjects = useCallback(
        async (query: string, signal?: AbortSignal) => {
            const subjects = await subjectApiClient.listUnassignedSubjects(
                clazz.id,
                query,
                10,
                undefined,
                signal,
            );

            return subjects.map(
                (s) =>
                    ({
                        value: s.id,
                        label: `${s.code} - ${s.name}`,
                    }) satisfies AsyncSelectOption,
            );
        },
        [subjectApiClient, clazz.id],
    );

    const fetchTeachers = useCallback(
        async (query: string, signal?: AbortSignal) => {
            const teachers = await userApiClient.listTeachers(
                query,
                10,
                undefined,
                signal,
            );

            return teachers.map(
                (t) =>
                    ({
                        value: t.id,
                        label: t.name,
                    }) satisfies AsyncSelectOption,
            );
        },
        [userApiClient],
    );

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedSubject) {
            setError(t("validation.selectSubject"));
            return;
        }

        setIsLoading(true);

        classApiClient
            .assignSubject(
                clazz.id,
                selectedSubject.value,
                selectedTeacher?.value,
            )
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", {
                        subject: selectedSubject.label,
                        class: clazz.name,
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
            title={t("title")}
            formId="assign-class-subject-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("assignButton")}
            cancelLabel={t("cancelButton")}
        >
            <Text fontSize="sm" color="gray.600" mb={4}>
                {t("dialog.context", { class: clazz.name })}
            </Text>

            <FormField label={t("fields.subject.label")}>
                <AsyncSelect
                    placeholder={t("fields.subject.placeholder")}
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    fetchOptions={fetchUnassignedSubjects}
                />
            </FormField>

            <FormField label={t("fields.teacher.label")}>
                <AsyncSelect
                    placeholder={t("fields.teacher.placeholder")}
                    value={selectedTeacher}
                    onChange={setSelectedTeacher}
                    fetchOptions={fetchTeachers}
                />
            </FormField>
        </FormDialog>
    );
}
