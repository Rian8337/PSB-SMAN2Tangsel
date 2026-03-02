"use client";

import {
    Box,
    Button,
    Field,
    Heading,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
    const t = useTranslations("LoginPage");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleLogin(formData: FormData) {
        const id = formData.get("id") as string;
        const password = formData.get("password") as string;

        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:3001/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id, password }),
            });

            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                setError(data.error ?? t("error"));
                return;
            }

            // Redirect to home page on successful login
            window.location.href = "/";
        } catch {
            setError(t("error"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box maxW="sm" mx="auto" mt="10">
            <Heading size="2xl" mb="6" textAlign="center">
                {t("title")}
            </Heading>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleLogin(new FormData(e.currentTarget));
                }}
            >
                <Stack gap="4">
                    <Field.Root required>
                        <Field.Label>{t("id")}</Field.Label>
                        <Input name="id" type="text" autoComplete="id" />
                    </Field.Root>

                    <Field.Root required>
                        <Field.Label>{t("password")}</Field.Label>
                        <Input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                        />
                    </Field.Root>

                    {error && (
                        <Text color="fg.error" role="alert">
                            {error}
                        </Text>
                    )}

                    <Button type="submit" loading={isLoading} width="full">
                        {t("login")}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}
