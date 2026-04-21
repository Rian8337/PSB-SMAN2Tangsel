"use client";

import { APIError } from "@/api";
import { useClassApiClient } from "@/providers/api/class-api-provider";
import { Input, Text } from "@chakra-ui/react";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";
import { validClassNameSchema } from "@psb/shared/validator";

export interface CreateClassModalProps {
    readonly isOpen: boolean;
    readonly activeSession: AcademicSessionDTO;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
}

export function CreateClassModal({
    isOpen,
    activeSession,
    onClose,
    onSuccess,
}: CreateClassModalProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("ClassManagement");
    const classApiClient = useClassApiClient();

    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
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

        if (!name.trim()) {
            setError(formT("missingFields"));
            return;
        }

        const parsedName = validClassNameSchema.safeParse(name.trim());

        if (!parsedName.success) {
            const issue = parsedName.error.issues[0];

            switch (issue.code) {
                case "too_small":
                    setError(formT("missingFields"));
                    break;

                case "too_big":
                    setError(t("validation.maxLength", { max: "50" }));
                    break;

                default:
                    setError(t("validation.invalidName"));
            }

            return;
        }

        setIsLoading(true);

        classApiClient
            .createClass(
                parsedName.data,
                activeSession.session,
                activeSession.semester,
            )
            .then(() => {
                toaster.create({
                    title: t("create.toast.successTitle"),
                    description: t("create.toast.successMessage", {
                        name: parsedName.data,
                    }),
                    type: "success",
                });

                handleClose();
                onSuccess();
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
            formId="create-class-form"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel={t("create.dialog.submitButton")}
            cancelLabel={t("create.dialog.cancelButton")}
        >
            <Text fontSize="sm" color="gray.600" mb={4}>
                {t("create.dialog.sessionContext", {
                    session: activeSession.session,
                    semester: activeSession.semester.toString(),
                })}
            </Text>

            <FormField label={t("fields.name.label")}>
                <Input
                    name="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value.toUpperCase());
                    }}
                    placeholder={t("fields.name.placeholder")}
                />
            </FormField>
        </FormDialog>
    );
}
