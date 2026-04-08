"use client";

import { Button, Dialog, VStack } from "@chakra-ui/react";
import { PropsWithChildren, SubmitEventHandler } from "react";

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
    children,
}: FormDialogProps) {
    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open) {
                    onClose();
                }
            }}
            placement="center"
        >
            <Dialog.Backdrop />

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

                <Dialog.Footer>
                    <Button variant="outline" onClick={onClose} mr={3}>
                        {cancelLabel}
                    </Button>

                    <Button
                        type="submit"
                        form={formId}
                        colorPalette="blue"
                        loading={isLoading}
                    >
                        {submitLabel}
                    </Button>
                </Dialog.Footer>

                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    );
}
