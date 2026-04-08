"use client";

import { APIError } from "@/api";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import { Input, NativeSelect } from "@chakra-ui/react";
import { UserRole } from "@psb/shared/types";
import { passwordRegex } from "@psb/shared/validator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";

export interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateUserModalProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("AccountManagement");
    const apiClient = useUserApiClient();

    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [role, setRole] = useState(UserRole.student);
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setName("");
        setIdentifier("");
        setRole(UserRole.student);
        setPassword("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !identifier || !password) {
            setError(formT("missingFields"));
            return;
        }

        if (!passwordRegex.test(password)) {
            setError(formT("passwordRequirements"));
            return;
        }

        setIsLoading(true);

        apiClient
            .createUser(name, password, role, identifier)
            .then(() => {
                toaster.create({
                    title: t("createUser.toast.successTitle"),
                    description: t("createUser.toast.successMessage", { name }),
                    type: "success",
                });

                onSuccess();
                handleClose();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError
                        ? e.message
                        : t("createUser.toast.errorMessage"),
                );

                toaster.create({
                    title: t("createUser.toast.errorTitle"),
                    description: t("createUser.toast.errorMessage"),
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
            title={t("createUser.dialog.title")}
            formId="create-user-form"
            onSubmit={handleSubmit}
            submitLabel={t("createUser.dialog.submitButton")}
            cancelLabel={t("createUser.dialog.cancelButton")}
            error={error}
            isLoading={isLoading}
        >
            <FormField label={t("createUser.dialog.nameLabel")}>
                <Input
                    name="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    placeholder={t("createUser.dialog.namePlaceholder")}
                />
            </FormField>

            <FormField label={t("columns.identifier")}>
                <Input
                    name="identifier"
                    value={identifier}
                    onChange={(e) => {
                        setIdentifier(e.target.value);
                    }}
                    placeholder={t("createUser.dialog.identifierPlaceholder")}
                />
            </FormField>

            <FormField label={t("createUser.dialog.roleLabel")}>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        name="role"
                        value={role.toString()}
                        onChange={(e) => {
                            setRole(Number(e.target.value) as UserRole);
                        }}
                        placeholder={t("createUser.dialog.rolePlaceholder")}
                    >
                        <option value={UserRole.student.toString()}>
                            {t("roles.0")}
                        </option>

                        <option value={UserRole.teacher.toString()}>
                            {t("roles.1")}
                        </option>

                        <option value={UserRole.administrator.toString()}>
                            {t("roles.2")}
                        </option>
                    </NativeSelect.Field>
                </NativeSelect.Root>
            </FormField>

            <FormField label={t("createUser.dialog.passwordLabel")}>
                <Input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                    placeholder={t("createUser.dialog.passwordPlaceholder")}
                />
            </FormField>
        </FormDialog>
    );
}
