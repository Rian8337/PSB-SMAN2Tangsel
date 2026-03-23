"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";
import { Toaster } from "./toaster";

export function Provider({ children }: PropsWithChildren) {
    return (
        <ChakraProvider value={defaultSystem}>
            <ThemeProvider
                attribute="class"
                disableTransitionOnChange
                forcedTheme="light"
            >
                {children}
                <Toaster />
            </ThemeProvider>
        </ChakraProvider>
    );
}
