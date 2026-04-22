"use client";

import { APIError } from "@/api";
import { useRouter } from "@/i18n/navigation";
import { useClassApiClient } from "@/providers/api/class-api-provider";
import { Input } from "@chakra-ui/react";
import { Class } from "@psb/shared/types";
import { validClassNameSchema } from "@psb/shared/validator";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { FormField } from "../ui/FormField";
import { PageForm } from "../ui/PageForm";
import { toaster } from "../ui/toaster";

export interface EditClassFormProps {
    readonly clazz: Class;
}

export function EditClassForm({ clazz }: EditClassFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("ClassManagement");
    const classApiClient = useClassApiClient();
    const router = useRouter();

    const [name, setName] = useState(clazz.name);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

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
            .updateClass(clazz.id, parsedName.data)
            .then(() => {
                toaster.create({
                    title: t("edit.toast.successTitle"),
                    description: t("edit.toast.successMessage", {
                        name: parsedName.data,
                    }),
                    type: "success",
                });

                router.push("/admin/classes");
                router.refresh();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError
                        ? e.message
                        : t("edit.toast.errorMessage"),
                );

                toaster.create({
                    title: t("edit.toast.errorTitle"),
                    description: t("edit.toast.errorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <PageForm
            title={t("edit.title")}
            backButtonUrl="/admin/classes"
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            submitLabel={t("edit.submitButton")}
        >
            <FormField label={t("fields.name.label")}>
                <Input
                    name="name"
                    value={name}
                    placeholder={t("fields.name.placeholder")}
                    onChange={(e) => {
                        setName(e.target.value.toUpperCase());
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>
        </PageForm>
    );
}
