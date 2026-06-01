"use client";

import { Link } from "@/i18n/navigation";
import { Box, Card, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { BookOpen, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "../layout/PageHeader";
import { UserRole } from "@psb/shared/types";

interface DashboardClientViewProps {
    readonly name: string;
    readonly role: UserRole;
    readonly activeSessionCode: string | null;
}

export function DashboardClientView({
    name,
    role,
    activeSessionCode,
}: DashboardClientViewProps) {
    const t = useTranslations("Dashboard");
    const sessionBase = activeSessionCode ? `/${activeSessionCode}` : "";

    const actions = [
        {
            href: "/schedule",
            icon: Calendar,
            color: "blue.500",
            title: t("cards.schedule.title"),
            description: t("cards.schedule.description"),
        },
        {
            href: "/subjects",
            icon: BookOpen,
            color: "teal.500",
            title: t("cards.subjects.title"),
            description: t(
                role === UserRole.student
                    ? "cards.subjects.studentDescription"
                    : "cards.subjects.teacherDescription",
            ),
        },
    ];

    return (
        <>
            <PageHeader title={t("welcome", { name })} />

            <Box p={{ base: 4, md: 8 }} w="full">
                <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={6}>
                    {actions.map((action, index) => (
                        <Link
                            key={index}
                            href={sessionBase + action.href}
                            style={{ display: "block", textDecoration: "none" }}
                        >
                            <Card.Root
                                h="full"
                                variant="elevated"
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{
                                    transform: "translateY(-4px)",
                                    shadow: "lg",
                                    borderColor: action.color,
                                }}
                                borderWidth="2px"
                                borderColor="transparent"
                            >
                                <Card.Body>
                                    <Flex direction="column" h="full">
                                        <Box
                                            p={3}
                                            bg={`${action.color.split(".")[0]}.100`}
                                            color={action.color}
                                            borderRadius="md"
                                            w="fit-content"
                                            mb={4}
                                        >
                                            <action.icon size={28} />
                                        </Box>
                                        <Card.Title mb={2} fontSize="xl">
                                            {action.title}
                                        </Card.Title>
                                        <Text color="gray.600">
                                            {action.description}
                                        </Text>
                                    </Flex>
                                </Card.Body>
                            </Card.Root>
                        </Link>
                    ))}
                </SimpleGrid>
            </Box>
        </>
    );
}
