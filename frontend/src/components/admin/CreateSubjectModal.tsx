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
    const t = useTranslations("SubjectManagement.create");
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
            setError(t("invalidCode"));
            return;
        }

        setIsLoading(true);

        apiClient
            .createSubject(code, name)
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", { name }),
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
            formId="create-subject-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("dialog.submitButton")}
            cancelLabel={t("dialog.cancelButton")}
        >
            <FormField label={t("dialog.code.label")}>
                <Input
                    name="code"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                    }}
                    placeholder={t("dialog.code.placeholder")}
                />
            </FormField>

            <FormField label={t("dialog.name.label")}>
                <Input
                    name="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    placeholder={t("dialog.name.placeholder")}
                />
            </FormField>
        </FormDialog>
    );
}
