"use client";

import { useDebounce } from "@/hooks";
import { Box, Input, List, Spinner, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export interface AsyncSelectOption {
    readonly value: number;
    readonly label: string;
}

interface AsyncSelectProps {
    readonly placeholder?: string;
    readonly value?: AsyncSelectOption | null;
    readonly onChange: (option: AsyncSelectOption | null) => void;
    readonly fetchOptions: (
        query: string,
        signal?: AbortSignal,
    ) => Promise<AsyncSelectOption[]>;
}

export function AsyncSelect({
    placeholder,
    value,
    onChange,
    fetchOptions,
}: AsyncSelectProps) {
    const t = useTranslations("AsyncSelect");
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value?.label ?? "");
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [isPending, startTransition] = useTransition();

    const debouncedQuery = useDebounce(inputValue, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                // Reset input to current value if they didn't select anything.
                setInputValue(value?.label ?? "");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [value]);

    const loadOptions = useCallback(
        async (query: string, signal?: AbortSignal) => {
            try {
                const data = await fetchOptions(query, signal);
                setOptions(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                setOptions([]);
            }
        },
        [fetchOptions],
    );

    // Fetch options when debounced query changes.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const controller = new AbortController();

        startTransition(() => loadOptions(debouncedQuery, controller.signal));

        return () => {
            controller.abort();
        };
    }, [debouncedQuery, isOpen, loadOptions]);

    return (
        <Box position="relative" w="full" ref={wrapperRef}>
            <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsOpen(true);

                    // Clear the actual selection if the user starts typing to change it.
                    if (value) {
                        onChange(null);
                    }
                }}
                onFocus={() => {
                    setIsOpen(true);
                }}
            />

            {isOpen && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg="white"
                    borderWidth="1px"
                    borderRadius="md"
                    boxShadow="lg"
                    zIndex={10}
                    maxH="200px"
                    overflowY="auto"
                >
                    {isPending ? (
                        <Box p={4} textAlign="center">
                            <Spinner size="sm" />
                        </Box>
                    ) : options.length > 0 ? (
                        <List.Root>
                            {options.map((option) => (
                                <List.Item
                                    key={option.value}
                                    px={4}
                                    py={2}
                                    cursor="pointer"
                                    _hover={{ bg: "gray.100" }}
                                    onClick={() => {
                                        setInputValue(option.label);
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                >
                                    {option.label}
                                </List.Item>
                            ))}
                        </List.Root>
                    ) : (
                        <Text
                            p={4}
                            textAlign="center"
                            color="gray.500"
                            fontSize="sm"
                        >
                            {t("noResults")}
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    );
}
