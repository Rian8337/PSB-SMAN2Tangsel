"use client";

import { HStack, IconButton, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
    rightElement?: React.ReactNode;
}

export function PageHeader({
    title,
    showBackButton = true,
    rightElement,
}: PageHeaderProps) {
    return (
        <HStack
            px={{ base: 4, md: 8 }}
            py={4}
            borderBottom="2px solid black"
            justifyContent="space-between"
            alignItems="center"
            bg="white"
        >
            <HStack spaceX={4}>
                <IconButton
                    aria-label="Go back"
                    variant="ghost"
                    visibility={showBackButton ? "visible" : "hidden"}
                >
                    <ArrowLeft size={32} color="black" strokeWidth={3} />
                </IconButton>

                <Text
                    fontSize={{ base: "xl", md: "3xl" }}
                    fontWeight="bold"
                    color="black"
                >
                    {title}
                </Text>
            </HStack>

            <HStack spaceX={4}>
                {rightElement}
                <NotificationBell />
            </HStack>
        </HStack>
    );
}
