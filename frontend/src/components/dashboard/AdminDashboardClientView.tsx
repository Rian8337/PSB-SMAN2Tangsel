"use client";

import {
    Box,
    Heading,
    Text,
    Flex,
    SimpleGrid,
    Card,
    Link,
} from "@chakra-ui/react";
import { Users, Calendar, BookOpen, PersonStanding, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminDashboardClientViewProps {
    name: string;
}

export function AdminDashboardClientView({
    name,
}: AdminDashboardClientViewProps) {
    const t = useTranslations("AdminDashboard");

    const actions = [
        {
            href: "/admin/users",
            icon: Users,
            color: "blue.500",
            title: t("cards.users.title"),
            description: t("cards.users.description"),
        },
        {
            href: "/admin/academic-years",
            icon: Calendar,
            color: "purple.500",
            title: t("cards.academicYears.title"),
            description: t("cards.academicYears.description"),
        },
        {
            href: "/admin/subjects",
            icon: BookOpen,
            color: "teal.500",
            title: t("cards.subjects.title"),
            description: t("cards.subjects.description"),
        },
        {
            href: "/admin/classes",
            icon: PersonStanding,
            color: "green.500",
            title: t("cards.classes.title"),
            description: t("cards.classes.description"),
        },
        {
            href: "/admin/schedules",
            icon: Clock,
            color: "orange.500",
            title: t("cards.schedules.title"),
            description: t("cards.schedules.description"),
        },
    ];

    return (
        <Box p={{ base: 4, md: 8 }} w="full">
            <Box mb={8}>
                <Heading as="h1" size="2xl" mb={2}>
                    {t("title")}
                </Heading>

                <Text color="gray.600" fontSize="lg">
                    {t("welcome", { name })}
                </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={6}>
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
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
    );
}
