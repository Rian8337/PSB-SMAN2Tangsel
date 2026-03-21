"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function Provider({ children }: PropsWithChildren) {
    return (
        <ChakraProvider value={defaultSystem}>
            <ThemeProvider
                attribute="class"
                disableTransitionOnChange
                forcedTheme="light"
            >
                {children}
            </ThemeProvider>
        </ChakraProvider>
    );
}
