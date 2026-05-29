"use client";

import { APIError } from "@/api";
import { useSubjectAssignmentSubmissionApiClient } from "@/providers/api/subject-assignment-submission-api-provider";
import {
    Box,
    Button,
    Flex,
    HStack,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { SubjectAssignmentSubmission } from "@psb/shared/types";
import { FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { FormField } from "../ui/FormField";
import { toaster } from "../ui/toaster";

export interface ManageAssignmentSubmissionFormProps {
    readonly assignmentId: number;
    readonly submission?: SubjectAssignmentSubmission;
    readonly onSuccess: () => void;
    readonly onCancel?: () => void;
}

interface ExistingAttachmentState {
    readonly id: number;
    name: string;
    deleted: boolean;
}

export function ManageAssignmentSubmissionForm({
    assignmentId,
    submission,
    onSuccess,
    onCancel,
}: ManageAssignmentSubmissionFormProps) {
    const t = useTranslations("ManageAssignmentSubmissionForm");
    const apiClient = useSubjectAssignmentSubmissionApiClient();

    const isEditMode = submission !== undefined;

    const [existingAttachments, setExistingAttachments] = useState<
        ExistingAttachmentState[]
    >(
        () =>
            submission?.attachments.map((a) => ({
                id: a.id,
                name: a.name,
                deleted: false,
            })) ?? [],
    );

    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();

        if (isEditMode) {
            const deletedIds = existingAttachments
                .filter((a) => a.deleted)
                .map((a) => a.id);

            const renames = existingAttachments
                .filter(
                    (a) =>
                        !a.deleted &&
                        a.name !==
                            submission.attachments.find(
                                (orig) => orig.id === a.id,
                            )?.name,
                )
                .map((a) => ({ id: a.id, newName: a.name }));

            formData.append("deletedAttachmentIds", JSON.stringify(deletedIds));
            formData.append("renamedAttachments", JSON.stringify(renames));
        }

        for (const file of newFiles) {
            formData.append("files", file);
        }

        const request = isEditMode
            ? apiClient.updateSubmission(assignmentId, formData)
            : apiClient.createSubmission(assignmentId, formData);

        request
            .then(() => {
                toaster.create({
                    title: isEditMode
                        ? t("editSuccessTitle")
                        : t("createSuccessTitle"),
                    type: "success",
                });

                onSuccess();
            })
            .catch((e: unknown) => {
                const title = isEditMode
                    ? t("editErrorTitle")
                    : t("createErrorTitle");

                const description =
                    e instanceof APIError ? e.message : undefined;

                toaster.create({ title, description, type: "error" });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <Box>
            <form onSubmit={handleSubmit}>
                {isEditMode && existingAttachments.some((a) => !a.deleted) && (
                    <Box mb={3}>
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
                                                aria-label={t("renameLabel")}
                                                onChange={(e) => {
                                                    setExistingAttachments(
                                                        (prev) =>
                                                            prev.map((a) =>
                                                                a.id ===
                                                                attachment.id
                                                                    ? {
                                                                          ...a,
                                                                          name: e
                                                                              .target
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
                                                aria-label={t(
                                                    "deleteAttachmentLabel",
                                                )}
                                                type="button"
                                                onClick={() => {
                                                    setExistingAttachments(
                                                        (prev) =>
                                                            prev.map((a) =>
                                                                a.id ===
                                                                attachment.id
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
                    </Box>
                )}

                <Box mb={3}>
                    <FormField label={t("addFilesLabel")}>
                        <VStack align="stretch" gap={2}>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                aria-label={t("addFilesLabel")}
                                onChange={(e) => {
                                    setNewFiles(
                                        Array.from(e.target.files ?? []),
                                    );
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
                </Box>

                <HStack gap={2}>
                    <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        loading={isLoading}
                    >
                        {isEditMode ? t("submitEdit") : t("submitCreate")}
                    </Button>

                    {isEditMode && onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            onClick={onCancel}
                        >
                            {t("cancelButton")}
                        </Button>
                    )}
                </HStack>
            </form>
        </Box>
    );
}
