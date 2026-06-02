import { Link } from "@/i18n/navigation";
import {
    Box,
    Button,
    Card,
    Flex,
    Heading,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { BookOpen, Calendar, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HomePage() {
    const t = useTranslations("HomePage");

    const features = [
        {
            icon: BookOpen,
            title: t("materialsTitle"),
            description: t("materialsDescription"),
            iconBg: "blue.100",
        },
        {
            icon: Calendar,
            title: t("scheduleTitle"),
            description: t("scheduleDescription"),
            iconBg: "teal.100",
        },
        {
            icon: ClipboardList,
            title: t("assignmentsTitle"),
            description: t("assignmentsDescription"),
            iconBg: "purple.100",
        },
    ] as const;

    return (
        <Flex
            minH="100dvh"
            alignItems="center"
            justifyContent="center"
            px={{ base: 6, md: 12, xl: 16 }}
            py={{ base: 8, md: 12 }}
        >
            <VStack gap={8} maxW="lg" w="full">
                <VStack gap={3} textAlign="center">
                    <Heading
                        as="h1"
                        size="2xl"
                        letterSpacing="tight"
                        color="gray.900"
                    >
                        {t("title")}
                    </Heading>

                    <Text fontSize="lg" color="gray.600">
                        {t("description")}
                    </Text>
                </VStack>

                <VStack gap={3} w="full">
                    {features.map((feature) => (
                        <Card.Root key={feature.title} variant="elevated" w="full">
                            <Card.Body>
                                <HStack gap={4} alignItems="flex-start">
                                    <Flex
                                        w="40px"
                                        h="40px"
                                        borderRadius="lg"
                                        bg={feature.iconBg}
                                        alignItems="center"
                                        justifyContent="center"
                                        flexShrink={0}
                                    >
                                        <feature.icon size={20} />
                                    </Flex>

                                    <Box>
                                        <Card.Title fontSize="sm" mb={1}>
                                            {feature.title}
                                        </Card.Title>
                                        <Text fontSize="sm" color="gray.600">
                                            {feature.description}
                                        </Text>
                                    </Box>
                                </HStack>
                            </Card.Body>
                        </Card.Root>
                    ))}
                </VStack>

                <Button asChild colorPalette="blue" size="lg" w="full">
                    <Link href="/login">{t("loginButton")}</Link>
                </Button>
            </VStack>
        </Flex>
    );
}
