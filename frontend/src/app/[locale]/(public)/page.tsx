import { Link } from "@/i18n/navigation";
import { Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export default function HomePage() {
    const t = useTranslations("HomePage");

    return (
        <Center w="full">
            <VStack gap={6} textAlign="center" maxW="lg">
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

                <Button asChild colorPalette="blue" size="lg" mt={4} w="full">
                    <Link href="/login">{t("loginButton")}</Link>
                </Button>
            </VStack>
        </Center>
    );
}
