"use client";

import { Heading, HStack, IconButton } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useRouter } from "@/i18n/navigation";

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
    const router = useRouter();

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
                    aria-label="go-back"
                    variant="ghost"
                    visibility={showBackButton ? "visible" : "hidden"}
                    onClick={() => {
                        router.back();
                    }}
                >
                    <ArrowLeft size={32} color="black" strokeWidth={3} />
                </IconButton>

                <Heading as="h2" size={{ base: "lg", md: "xl" }} color="black">
                    {title}
                </Heading>
            </HStack>

            <HStack spaceX={4}>
                {rightElement}
                <NotificationBell />
            </HStack>
        </HStack>
    );
}
