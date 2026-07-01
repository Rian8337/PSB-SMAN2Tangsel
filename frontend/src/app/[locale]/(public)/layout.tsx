import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Box, Flex, Image, Text, VStack } from "@chakra-ui/react";
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
                            src="/school-logo.webp"
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

                <LocaleSwitcher menuPlacement="right" />
            </VStack>

            {/* Content area (full screen on mobile, right panel on desktop) */}
            <Box flex={1} overflowY="auto" bg="gray.50" position="relative">
                {/* Mobile: small logo top-left + globe icon top-right */}
                <Box
                    display={{ base: "block", md: "none" }}
                    position="absolute"
                    top={3}
                    left={3}
                    zIndex={10}
                >
                    <Box
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="white"
                        shadow="sm"
                    >
                        <Image
                            src="/school-logo.webp"
                            alt="School Logo"
                            w="full"
                            h="full"
                            objectFit="contain"
                        />
                    </Box>
                </Box>

                <Box
                    display={{ base: "block", md: "none" }}
                    position="absolute"
                    top={1}
                    right={1}
                    zIndex={10}
                >
                    <LocaleSwitcher menuPlacement="bottom-end" />
                </Box>

                {children}
            </Box>
        </Flex>
    );
}
