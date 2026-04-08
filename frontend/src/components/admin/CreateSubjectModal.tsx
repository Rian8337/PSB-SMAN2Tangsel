"use client";

import { APIError } from "@/api";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import { Input } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";

export interface CreateSubjectModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function CreateSubjectModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateSubjectModalProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("SubjectManagement");
    const apiClient = useSubjectApiClient();

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setCode("");
        setName("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!code.trim() || !name.trim()) {
            setError(formT("missingFields"));
            return;
        }

        if (!/^[A-Z0-9-]+$/.test(code)) {
            setError(t("validation.invalidCode"));
            return;
        }

        setIsLoading(true);

        apiClient
            .createSubject(code, name)
            .then(() => {
                toaster.create({
                    title: t("create.toast.successTitle"),
                    description: t("create.toast.successMessage", { name }),
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
            title={t("create.dialog.title")}
            formId="create-subject-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("create.dialog.submitButton")}
            cancelLabel={t("create.dialog.cancelButton")}
        >
            <FormField label={t("create.dialog.code.label")}>
                <Input
                    name="code"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                    }}
                    placeholder={t("create.dialog.code.placeholder")}
                />
            </FormField>

            <FormField label={t("create.dialog.name.label")}>
                <Input
                    name="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    placeholder={t("create.dialog.name.placeholder")}
                />
            </FormField>
        </FormDialog>
    );
}
