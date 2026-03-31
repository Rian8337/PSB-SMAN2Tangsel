"use client";

import { APIError } from "@/api";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import {
    Button,
    Dialog,
    Field,
    Input,
    NativeSelect,
    VStack,
} from "@chakra-ui/react";
import { UserRole } from "@psb/shared/types";
import { passwordRegex } from "@psb/shared/validator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toaster } from "../ui/toaster";

interface CreateUserModalProps {
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
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open) {
                    handleClose();
                }
            }}
        >
            <Dialog.Backdrop />

            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>Register New User</Dialog.Title>
                </Dialog.Header>

                <Dialog.Body>
                    <VStack
                        as="form"
                        id="create-user-form"
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
                                {t("createUser.dialog.nameLabel")}
                            </Field.Label>

                            <Input
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                }}
                                placeholder={t(
                                    "createUser.dialog.namePlaceholder",
                                )}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>{t("columns.identifier")}</Field.Label>

                            <Input
                                value={identifier}
                                onChange={(e) => {
                                    setIdentifier(e.target.value);
                                }}
                                placeholder={t(
                                    "createUser.dialog.identifierPlaceholder",
                                )}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>
                                {t("createUser.dialog.roleLabel")}
                            </Field.Label>

                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={role.toString()}
                                    onChange={(e) => {
                                        setRole(
                                            Number(e.target.value) as UserRole,
                                        );
                                    }}
                                    placeholder={t(
                                        "createUser.dialog.rolePlaceholder",
                                    )}
                                >
                                    <option value={UserRole.student.toString()}>
                                        {t("roles.0")}
                                    </option>

                                    <option value={UserRole.teacher.toString()}>
                                        {t("roles.1")}
                                    </option>

                                    <option
                                        value={UserRole.administrator.toString()}
                                    >
                                        {t("roles.2")}
                                    </option>
                                </NativeSelect.Field>
                            </NativeSelect.Root>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>
                                {t("createUser.dialog.passwordLabel")}
                            </Field.Label>

                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                placeholder={t(
                                    "createUser.dialog.passwordPlaceholder",
                                )}
                            />
                        </Field.Root>
                    </VStack>
                </Dialog.Body>

                <Dialog.Footer>
                    <Button variant="outline" onClick={handleClose} mr={3}>
                        {t("createUser.dialog.cancelButton")}
                    </Button>

                    <Button
                        type="submit"
                        form="create-user-form"
                        colorPalette="blue"
                        loading={isLoading}
                    >
                        {t("createUser.dialog.submitButton")}
                    </Button>
                </Dialog.Footer>

                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    );
}
