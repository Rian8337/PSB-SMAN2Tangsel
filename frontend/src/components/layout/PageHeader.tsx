"use client";

import { HStack, IconButton, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
}

export function PageHeader({ title, showBackButton = true }: PageHeaderProps) {
    return (
        <HStack
            px={8}
            py={4}
            borderBottom="2px solid black"
            justifyContent="space-between"
            alignItems="center"
            bg="white"
        >
            <IconButton
                aria-label="Go back"
                variant="ghost"
                visibility={showBackButton ? "visible" : "hidden"}
            >
                <ArrowLeft size={32} color="black" strokeWidth={3} />
            </IconButton>

            <Text fontSize="3xl" fontWeight="bold" color="black">
                {title}
            </Text>

            <NotificationBell />
        </HStack>
    );
}
