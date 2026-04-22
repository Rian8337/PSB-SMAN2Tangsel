"use client";

import { APIError } from "@/api";
import { useRouter } from "@/i18n/navigation";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import { Input } from "@chakra-ui/react";
import { Subject } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { FormField } from "../ui/FormField";
import { PageForm } from "../ui/PageForm";
import { Switch } from "../ui/switch";
import { toaster } from "../ui/toaster";

export interface EditSubjectFormProps {
    readonly subject: Subject;
}

export function EditSubjectForm({ subject }: EditSubjectFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("SubjectManagement");
    const subjectApiClient = useSubjectApiClient();
    const router = useRouter();

    const [code, setCode] = useState(subject.code);
    const [name, setName] = useState(subject.name);
    const [active, setActive] = useState(subject.active);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        subjectApiClient
            .updateSubject(subject.id, code, name, active)
            .then(() => {
                toaster.create({
                    title: t("edit.toast.successTitle"),
                    description: t("edit.toast.successMessage", { name }),
                    type: "success",
                });

                router.push("/admin/subjects");
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
            title={t("title")}
            backButtonUrl="/admin/subjects"
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            submitLabel={t("edit.submitButton")}
        >
            <FormField label={t("fields.code.label")}>
                <Input
                    name="code"
                    value={code}
                    placeholder={t("fields.code.placeholder")}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.name.label")}>
                <Input
                    name="name"
                    value={name}
                    placeholder={t("fields.name.placeholder")}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("fields.active.label")}>
                <Switch
                    name="active"
                    colorPalette="blue"
                    checked={active}
                    onCheckedChange={(e) => {
                        setActive(e.checked);
                    }}
                />
            </FormField>
        </PageForm>
    );
}
