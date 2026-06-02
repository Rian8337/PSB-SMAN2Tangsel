import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Box, Flex, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

export default function PublicLayout({ children }: PropsWithChildren) {
    const t = useTranslations("Global");

    return (
        <Flex minH="100dvh" w="full">
            {/* Desktop: branded panel on the left */}
            <VStack
                display={{ base: "none", md: "flex" }}
                w="280px"
                flexShrink={0}
                bg="#B2CFF6"
                py={8}
                px={6}
                justifyContent="space-between"
                alignItems="center"
            >
                <VStack gap={6} textAlign="center">
                    <Box
                        w="80px"
                        h="80px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="white"
                        shadow="md"
                    >
                        <Image
                            src="/school-logo.png"
                            alt="School Logo"
                            w="full"
                            h="full"
                            objectFit="contain"
                        />
                    </Box>

                    <Text
                        fontWeight="bold"
                        fontSize="md"
                        lineHeight="short"
                        textAlign="center"
                    >
                        {t("appName")}
                    </Text>
                </VStack>

                <LocaleSwitcher />
            </VStack>

            {/* Right side: mobile header + scrollable content */}
            <Flex flex={1} direction="column" overflow="hidden">
                {/* Mobile: top header bar */}
                <Flex
                    display={{ base: "flex", md: "none" }}
                    h="16"
                    bg="#B2CFF6"
                    px={4}
                    alignItems="center"
                    justifyContent="space-between"
                    flexShrink={0}
                    shadow="sm"
                >
                    <HStack gap={3}>
                        <Image
                            src="/school-logo.png"
                            alt="School Logo"
                            width={32}
                            height={32}
                        />
                        <Text fontWeight="bold" fontSize="sm">
                            {t("appName")}
                        </Text>
                    </HStack>

                    <LocaleSwitcher />
                </Flex>

                <Box flex={1} overflowY="auto" bg="gray.50">
                    {children}
                </Box>
            </Flex>
        </Flex>
    );
}
