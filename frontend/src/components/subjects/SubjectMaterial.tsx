"use client";

import { useRouter } from "@/i18n/navigation";
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
import { SubjectMaterial as SubjectMaterialData, UserRole } from "@psb/shared/types";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { toaster } from "../ui/toaster";

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
    const t = useTranslations("SubjectMaterial");
    const apiClient = useSubjectMaterialApiClient();
    const router = useRouter();

    const [material, setMaterial] = useState<SubjectMaterialData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isTeacher = role === UserRole.teacher;
    const backButtonUrl = `/subjects/${classSubjectId.toString()}`;

    const backendBaseUrl =
        (
            (globalThis as Record<string, unknown>)
                .__API_BASE_URL__ as string | undefined
        ) ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://127.0.0.1:3001";

    const fetchMaterial = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);

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
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [apiClient, materialId, router, t, backButtonUrl],
    );

    useEffect(() => {
        const controller = new AbortController();

        void fetchMaterial(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchMaterial]);

    if (isLoading) {
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
                                <Flex key={attachment.id} align="center" gap={2}>
                                    <FileText size={18} />
                                    <a
                                        href={`${backendBaseUrl}/materials/${materialId.toString()}/attachments/${attachment.id.toString()}`}
                                        download
                                    >
                                        <Text color="blue.500" _hover={{ textDecoration: "underline" }}>
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
                        ? new Date(material.createdAt).toLocaleDateString()
                        : ""}
                </Text>

                <Text fontSize="sm" color="gray.500" mb={isTeacher ? 4 : 0}>
                    {t("lastUpdatedAt")}{" "}
                    {material
                        ? new Date(material.lastUpdatedAt).toLocaleDateString()
                        : ""}
                </Text>

                {isTeacher && (
                    <HStack gap={2}>
                        <Button variant="outline" size="sm">
                            {t("editButton")}
                        </Button>

                        <Button variant="outline" size="sm">
                            {t("deleteButton")}
                        </Button>

                        <Button variant="outline" size="sm">
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
