"use client";

import { Button, Flex, HStack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export interface PaginationProps {
    readonly page: number;
    readonly hasMore: boolean;
    readonly isLoading?: boolean;
    readonly onPrevPage: () => void;
    readonly onNextPage: () => void;
}

export function Pagination({
    page,
    hasMore,
    isLoading = false,
    onPrevPage,
    onNextPage,
}: PaginationProps) {
    const t = useTranslations("Pagination");

    return (
        <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color="gray.500">
                {t("info", { page: page.toString() })}
            </Text>

            <HStack gap={2}>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1 || isLoading}
                    onClick={onPrevPage}
                >
                    {t("previous")}
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasMore || isLoading}
                    onClick={onNextPage}
                >
                    {t("next")}
                </Button>
            </HStack>
        </Flex>
    );
}
