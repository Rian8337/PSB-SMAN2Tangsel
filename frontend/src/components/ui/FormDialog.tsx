"use client";

import { Button, Dialog, Flex, Portal, VStack } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode, SubmitEventHandler } from "react";

export interface FormDialogProps extends PropsWithChildren {
    readonly title: string;
    readonly formId: string;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSubmit: SubmitEventHandler<HTMLDivElement>;
    readonly isLoading?: boolean;
    readonly error?: string | null;
    readonly submitLabel: string;
    readonly cancelLabel: string;
    readonly leftAction?: ReactNode;
}

export function FormDialog({
    isOpen,
    onClose,
    title,
    formId,
    onSubmit,
    isLoading = false,
    error = null,
    submitLabel,
    cancelLabel,
    leftAction,
    children,
}: FormDialogProps) {
    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open && !isLoading) {
                    onClose();
                }
            }}
            placement="center"
            lazyMount
            unmountOnExit
        >
            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <VStack
                                as="form"
                                id={formId}
                                spaceY={4}
                                onSubmit={onSubmit}
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

                                {children}
                            </VStack>
                        </Dialog.Body>

                        <Dialog.Footer
                            display="flex"
                            justifyContent="space-between"
                            w="full"
                        >
                            <Flex>{leftAction}</Flex>

                            <Flex gap={3}>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    {cancelLabel}
                                </Button>

                                <Button
                                    type="submit"
                                    form={formId}
                                    colorPalette="blue"
                                    loading={isLoading}
                                    disabled={isLoading}
                                >
                                    {submitLabel}
                                </Button>
                            </Flex>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger disabled={isLoading} />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
