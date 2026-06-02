"use client";

import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { PropsWithChildren, SubmitEventHandler } from "react";
import { PageHeader } from "../layout/PageHeader";

export interface PageFormProps extends PropsWithChildren {
    readonly title: string;
    readonly onSubmit: SubmitEventHandler<HTMLDivElement>;
    readonly error?: string | null;
    readonly isLoading?: boolean;
    readonly backButtonUrl?: string;
    readonly submitLabel: string;
    readonly showSessionSwitcher?: boolean;
}

export function PageForm({
    title,
    onSubmit,
    error = null,
    isLoading = false,
    submitLabel,
    backButtonUrl,
    showSessionSwitcher,
    children,
}: PageFormProps) {
    return (
        <>
            <PageHeader title={title} backButtonUrl={backButtonUrl} showSessionSwitcher={showSessionSwitcher} />

            <Box p={{ base: 4, md: 8 }} maxW="md">
                <VStack
                    align="flex-start"
                    spaceY={6}
                    as="form"
                    onSubmit={onSubmit}
                >
                    {error && (
                        <Text color="red.500" fontSize="sm" fontWeight="medium">
                            {error}
                        </Text>
                    )}

                    {children}

                    <Button
                        type="submit"
                        variant="outline"
                        borderColor="black"
                        color="black"
                        borderRadius="sm"
                        loading={isLoading}
                        _hover={{ bg: "gray.50" }}
                    >
                        {submitLabel}
                    </Button>
                </VStack>
            </Box>
        </>
    );
}
