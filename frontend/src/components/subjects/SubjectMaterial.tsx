"use client";

import { backendBaseUrl } from "@/api/backendBaseUrl";
import { useRouter } from "@/i18n/navigation";
import { useSessionCode } from "@/hooks";
import { useSubjectMaterialApiClient } from "@/providers/api/subject-material-api-provider";
import {
    Box,
    Button,
    Flex,
    HStack,
    Heading,
    Spinner,
    Text,
} from "@chakra-ui/react";
import {
    SubjectMaterial as SubjectMaterialData,
    UserRole,
} from "@psb/shared/types";
import { FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "../layout/PageHeader";
import { toaster } from "../ui/toaster";

function buildVisibilityFormData(material: SubjectMaterialData): FormData {
    const formData = new FormData();

    formData.append("title", material.title);
    formData.append("description", material.description ?? "");
    formData.append("visible", (!material.visible).toString());
    formData.append("deletedAttachmentIds", JSON.stringify([]));
    formData.append("renamedAttachments", JSON.stringify([]));

    return formData;
}

export interface SubjectMaterialProps {
    readonly materialId: number;
    readonly classSubjectId: number;
    readonly role: UserRole;
}

export function SubjectMaterial({
    materialId,
    classSubjectId,
    role,
}: SubjectMaterialProps) {
    const sessionCode = useSessionCode();
    const t = useTranslations("SubjectMaterial");
    const apiClient = useSubjectMaterialApiClient();

    const locale = useLocale();
    const router = useRouter();

    const [material, setMaterial] = useState<SubjectMaterialData | null>(null);
    const [isPending, startTransition] = useTransition();

    const isTeacher = role === UserRole.teacher;
    const backButtonUrl = `/${sessionCode}/subjects/${classSubjectId.toString()}`;

    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

    const fetchMaterial = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await apiClient.getMaterial(materialId, signal);

                setMaterial(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchErrorTitle"),
                    description: t("fetchErrorMessage"),
                    type: "error",
                });

                router.push(backButtonUrl);
            }
        },
        [apiClient, materialId, router, t, backButtonUrl],
    );

    useEffect(() => {
        const controller = new AbortController();

        startTransition(() => fetchMaterial(controller.signal));

        return () => {
            controller.abort();
        };
    }, [fetchMaterial]);

    if (isPending) {
        return (
            <>
                <PageHeader title="" backButtonUrl={backButtonUrl} />

                <Flex justify="center" align="center" h="200px">
                    <Spinner size="xl" />
                </Flex>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={material?.subject.name ?? ""}
                backButtonUrl={backButtonUrl}
            />

            <Box p={{ base: 4, md: 8 }}>
                <Heading as="h3" size="lg" mb={2}>
                    {material?.title}
                </Heading>

                {material?.description && (
                    <Text mb={4}>{material.description}</Text>
                )}

                <Box mb={4}>
                    {material?.attachments.length === 0 ? (
                        <Text color="gray.500">{t("noAttachments")}</Text>
                    ) : (
                        <Flex direction="column" gap={2}>
                            {material?.attachments.map((attachment) => (
                                <Flex
                                    key={attachment.id}
                                    align="center"
                                    gap={2}
                                >
                                    <FileText size={18} />
                                    <a
                                        href={`${backendBaseUrl}/materials/${materialId.toString()}/attachments/${attachment.id.toString()}`}
                                        download
                                    >
                                        <Text
                                            color="blue.500"
                                            _hover={{
                                                textDecoration: "underline",
                                            }}
                                        >
                                            {attachment.name}
                                        </Text>
                                    </a>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Box>

                <Text fontSize="sm" color="gray.500">
                    {t("createdAt")}{" "}
                    {material
                        ? new Date(material.createdAt).toLocaleDateString(
                              locale,
                              {
                                  year: "numeric",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                              },
                          )
                        : ""}
                </Text>

                <Text fontSize="sm" color="gray.500" mb={isTeacher ? 4 : 0}>
                    {t("lastUpdatedAt")}{" "}
                    {material
                        ? new Date(material.lastUpdatedAt).toLocaleDateString(
                              locale,
                              {
                                  year: "numeric",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                              },
                          )
                        : ""}
                </Text>

                {isTeacher && (
                    <HStack gap={2}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                router.push(
                                    `/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}/edit`,
                                );
                            }}
                        >
                            {t("editButton")}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            loading={isDeleting}
                            onClick={() => {
                                if (!window.confirm(t("deleteButton") + "?")) {
                                    return;
                                }

                                setIsDeleting(true);

                                apiClient
                                    .deleteMaterial(materialId)
                                    .then(() => {
                                        toaster.create({
                                            title: t("deleteButton"),
                                            type: "success",
                                        });

                                        router.push(backButtonUrl);
                                    })
                                    .catch(() => {
                                        toaster.create({
                                            title: t("deleteButton"),
                                            description: t("fetchErrorMessage"),
                                            type: "error",
                                        });
                                    })
                                    .finally(() => {
                                        setIsDeleting(false);
                                    });
                            }}
                        >
                            {t("deleteButton")}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            loading={isTogglingVisibility}
                            onClick={() => {
                                if (!material) {
                                    return;
                                }

                                setIsTogglingVisibility(true);

                                apiClient
                                    .updateMaterial(
                                        materialId,
                                        buildVisibilityFormData(material),
                                    )
                                    .then(() => {
                                        startTransition(() =>
                                            fetchMaterial(),
                                        );
                                    })
                                    .catch(() => {
                                        toaster.create({
                                            title: t("fetchErrorTitle"),
                                            description: t("fetchErrorMessage"),
                                            type: "error",
                                        });
                                    })
                                    .finally(() => {
                                        setIsTogglingVisibility(false);
                                    });
                            }}
                        >
                            {material?.visible
                                ? t("hideFromStudents")
                                : t("showToStudents")}
                        </Button>
                    </HStack>
                )}
            </Box>
        </>
    );
}
