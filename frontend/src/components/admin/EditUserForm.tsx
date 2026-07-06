"use client";

import { APIError } from "@/api";
import { useRouter } from "@/i18n/navigation";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import { Input } from "@chakra-ui/react";
import { UserListItem } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "../ui/FormField";
import { PageForm } from "../ui/PageForm";
import { Switch } from "../ui/switch";
import { toaster } from "../ui/toaster";

export interface EditUserFormProps {
    readonly currentUserId: number;
    readonly user: UserListItem;
}

export function EditUserForm({ user, currentUserId }: EditUserFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("EditUser");
    const userApiClient = useUserApiClient();
    const router = useRouter();

    const [name, setName] = useState(user.name);
    const [identifier, setIdentifier] = useState(user.identifier);
    const [isActive, setIsActive] = useState(user.active);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !identifier.trim()) {
            setError(formT("missingFields"));
            return;
        }

        setIsLoading(true);

        userApiClient
            .updateUser(user.id, name, identifier, isActive)
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", { name }),
                    type: "success",
                });

                router.push("/admin/users");
                router.refresh();
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
        <PageForm
            title={t("title")}
            backButtonUrl="/admin/users"
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            submitLabel={t("updateButton")}
            showSessionSwitcher={false}
        >
            <FormField label={t("fields.identifier.label")}>
                <Input
                    name="identifier"
                    value={identifier}
                    placeholder={t("fields.identifier.placeholder")}
                    bg="gray.200"
                    border="none"
                    borderRadius="sm"
                    onChange={(e) => {
                        setIdentifier(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.name.label")}>
                <Input
                    name="name"
                    value={name}
                    placeholder={t("fields.name.placeholder")}
                    bg="gray.200"
                    border="none"
                    borderRadius="sm"
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.active.label")}>
                <Switch
                    colorPalette="blue"
                    checked={isActive}
                    readOnly={user.id === currentUserId}
                    disabled={user.id === currentUserId}
                    onCheckedChange={(e) => {
                        setIsActive(e.checked);
                    }}
                />
            </FormField>
        </PageForm>
    );
}
