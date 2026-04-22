"use client";

import { Field } from "@chakra-ui/react";
import React, { PropsWithChildren, ReactNode } from "react";

export interface FormFieldProps extends PropsWithChildren {
    /**
     * The main label for the form field.
     */
    readonly label: string;

    /**
     * The unique identifier for the field, used to associate the label with the input.
     */
    readonly id?: string;

    /**
     * Secondary text or icon next to the label.
     */
    readonly labelAccessory?: ReactNode;

    /**
     * The error message to automatically trigger the invalid state.
     */
    readonly error?: string;
}

export function FormField({
    label,
    id,
    labelAccessory,
    error,
    children,
}: FormFieldProps) {
    return (
        <Field.Root invalid={!!error} w="full">
            <Field.Label
                htmlFor={id}
                display="flex"
                justifyContent="space-between"
                w="full"
                mb={2}
                fontWeight="medium"
            >
                <span>{label}</span>

                {labelAccessory && <span>{labelAccessory}</span>}
            </Field.Label>

            {children}

            {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
    );
}
