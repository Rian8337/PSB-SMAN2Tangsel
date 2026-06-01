"use client";

import { APIError } from "@/api";
import { useRouter } from "@/i18n/navigation";
import { useSubjectAssignmentApiClient } from "@/providers/api/subject-assignment-api-provider";
import {
    Box,
    Button,
    Flex,
    HStack,
    Input,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { TeacherSubjectAssignment } from "@psb/shared/types";
import { FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { FormField } from "../ui/FormField";
import { PageForm } from "../ui/PageForm";
import { Switch } from "../ui/switch";
import { toaster } from "../ui/toaster";

export interface ManageAssignmentFormProps {
    readonly classSubjectId: number;
    readonly assignment?: TeacherSubjectAssignment;
}

interface ExistingAttachmentState {
    readonly id: number;
    name: string;
    deleted: boolean;
}

export function ManageAssignmentForm({
    classSubjectId,
    assignment,
}: ManageAssignmentFormProps) {
    const t = useTranslations("ManageAssignmentForm");
    const apiClient = useSubjectAssignmentApiClient();
    const router = useRouter();

    const isEditMode = assignment !== undefined;

    const backUrl = isEditMode
        ? `/subjects/${classSubjectId.toString()}/assignments/${assignment.id.toString()}`
        : `/subjects/${classSubjectId.toString()}`;

    const [title, setTitle] = useState(assignment?.title ?? "");

    const [description, setDescription] = useState(
        assignment?.description ?? "",
    );

    const [dueAt, setDueAt] = useState(
        assignment?.dueAt
            ? new Date(assignment.dueAt).toISOString().slice(0, 16)
            : "",
    );

    const [visible, setVisible] = useState(assignment?.visible ?? false);

    const [existingAttachments, setExistingAttachments] = useState<
        ExistingAttachmentState[]
    >(
        () =>
            assignment?.attachments.map((a) => ({
                id: a.id,
                name: a.name,
                deleted: false,
            })) ?? [],
    );

    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();

        formData.append("title", title);
        formData.append("description", description);
        formData.append("dueAt", dueAt);
        formData.append("visible", visible.toString());

        if (isEditMode) {
            const deletedIds = existingAttachments
                .filter((a) => a.deleted)
                .map((a) => a.id);

            const renames = existingAttachments
                .filter(
                    (a) =>
                        !a.deleted &&
                        a.name !==
                            assignment.attachments.find(
                                (orig) => orig.id === a.id,
                            )?.name,
                )
                .map((a) => ({ id: a.id, newName: a.name }));

            formData.append("deletedAttachmentIds", JSON.stringify(deletedIds));
            formData.append("renamedAttachments", JSON.stringify(renames));
        } else {
            formData.append("classSubjectId", classSubjectId.toString());
        }

        for (const file of newFiles) {
            formData.append("files", file);
        }

        const request = isEditMode
            ? apiClient.updateAssignment(assignment.id, formData)
            : apiClient.createAssignment(formData);

        request
            .then(() => {
                toaster.create({
                    title: isEditMode
                        ? t("editSuccessTitle")
                        : t("createSuccessTitle"),
                    type: "success",
                });

                router.push(backUrl);
                router.refresh();
            })
            .catch((e: unknown) => {
                const msg =
                    e instanceof APIError
                        ? e.message
                        : isEditMode
                          ? t("editErrorTitle")
                          : t("createErrorTitle");

                setError(msg);

                toaster.create({
                    title: isEditMode
                        ? t("editErrorTitle")
                        : t("createErrorTitle"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <PageForm
            title={assignment?.subject.name ?? ""}
            backButtonUrl={backUrl}
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            submitLabel={isEditMode ? t("submitEdit") : t("submitCreate")}
        >
            <FormField label={t("titleLabel")}>
                <Input
                    name="title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("descriptionLabel")}>
                <Textarea
                    name="description"
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("dueAtLabel")}>
                <Input
                    name="dueAt"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => {
                        setDueAt(e.target.value);
                    }}
                    _focus={{ ring: 2, ringColor: "blue.500" }}
                />
            </FormField>

            <FormField label={t("visibleLabel")}>
                <Switch
                    colorPalette="blue"
                    checked={visible}
                    onCheckedChange={(e) => {
                        setVisible(e.checked);
                    }}
                />
            </FormField>

            {isEditMode && existingAttachments.length > 0 && (
                <FormField label={t("attachmentsLabel")}>
                    <VStack align="stretch" gap={2}>
                        {existingAttachments.map((attachment) =>
                            attachment.deleted ? null : (
                                <Flex
                                    key={attachment.id}
                                    align="center"
                                    gap={2}
                                >
                                    <FileText size={16} />

                                    <Input
                                        size="sm"
                                        flex={1}
                                        value={attachment.name}
                                        onChange={(e) => {
                                            setExistingAttachments((prev) =>
                                                prev.map((a) =>
                                                    a.id === attachment.id
                                                        ? {
                                                              ...a,
                                                              name: e.target
                                                                  .value,
                                                          }
                                                        : a,
                                                ),
                                            );
                                        }}
                                        _focus={{
                                            ring: 2,
                                            ringColor: "blue.500",
                                        }}
                                    />

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        colorPalette="red"
                                        aria-label={t("deleteAttachmentLabel")}
                                        onClick={() => {
                                            setExistingAttachments((prev) =>
                                                prev.map((a) =>
                                                    a.id === attachment.id
                                                        ? {
                                                              ...a,
                                                              deleted: true,
                                                          }
                                                        : a,
                                                ),
                                            );
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </Flex>
                            ),
                        )}
                    </VStack>
                </FormField>
            )}

            <FormField label={t("addFilesLabel")}>
                <VStack align="stretch" gap={2}>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                            setNewFiles(Array.from(e.target.files ?? []));
                        }}
                        _focus={{ ring: 2, ringColor: "blue.500" }}
                    />

                    {newFiles.length > 0 && (
                        <Box>
                            {newFiles.map((f) => (
                                <HStack key={f.name} gap={1}>
                                    <FileText size={14} />
                                    <Text fontSize="sm">{f.name}</Text>
                                </HStack>
                            ))}
                        </Box>
                    )}
                </VStack>
            </FormField>
        </PageForm>
    );
}
