"use client";

import { APIError } from "@/api";
import { useClassStudentApiClient } from "@/providers/api/class-student-api-provider";
import { Text } from "@chakra-ui/react";
import { Class } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { AsyncSelect, AsyncSelectOption } from "../ui/AsyncSelect";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";

export interface AssignClassStudentModalProps {
    readonly isOpen: boolean;
    readonly clazz: Class;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function AssignClassStudentModal({
    isOpen,
    clazz,
    onClose,
    onSuccess,
}: AssignClassStudentModalProps) {
    const t = useTranslations("ClassStudentManagement.enroll");
    const classStudentApiClient = useClassStudentApiClient();

    const [selectedStudent, setSelectedStudent] =
        useState<AsyncSelectOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedStudent(null);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const fetchUnenrolledStudents = useCallback(
        async (query: string, signal?: AbortSignal) => {
            const students = await classStudentApiClient.getUnenrolledStudents(
                clazz.id,
                query,
                10,
                undefined,
                signal,
            );

            return students.map(
                (s) =>
                    ({
                        value: s.id,
                        label: `${s.identifier} - ${s.name}`,
                    }) satisfies AsyncSelectOption,
            );
        },
        [classStudentApiClient, clazz.id],
    );

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedStudent) {
            setError(t("validation.selectStudent"));
            return;
        }

        setIsLoading(true);

        classStudentApiClient
            .enrollStudent(clazz.id, selectedStudent.value)
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", {
                        student: selectedStudent.label,
                        class: clazz.name,
                    }),
                    type: "success",
                });

                handleClose();
                onSuccess();
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
            formId="assign-class-student-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("submitButton")}
            cancelLabel={t("cancelButton")}
        >
            <Text fontSize="sm" color="gray.600" mb={4}>
                {t("dialog.context", { class: clazz.name })}
            </Text>

            <FormField label={t("fields.student.label")}>
                <AsyncSelect
                    placeholder={t("fields.student.placeholder")}
                    value={selectedStudent}
                    onChange={setSelectedStudent}
                    fetchOptions={fetchUnenrolledStudents}
                />
            </FormField>
        </FormDialog>
    );
}
