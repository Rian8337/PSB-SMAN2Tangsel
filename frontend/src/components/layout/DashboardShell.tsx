"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Box, Flex, IconButton, Menu, VStack } from "@chakra-ui/react";
import { Book, Globe, Home } from "lucide-react";
import { Locale, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { PropsWithChildren } from "react";
import { Avatar } from "../ui/avatar";

export function DashboardShell(props: PropsWithChildren) {
    const t = useTranslations("DashboardShell");
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    function changeLocale(nextLocale: Locale) {
        router.replace({ pathname }, { locale: nextLocale });
    }

    return (
        <Flex h="100dvh" w="full" overflow="hidden" bg="white">
            <VStack
                w="80px"
                display={{ base: "none", md: "flex" }}
                bg="#B2CFF6"
                py={6}
                justifyContent="space-between"
                alignItems="center"
                boxShadow="sm"
                zIndex={10}
            >
                <VStack spaceY={8}>
                    <Box
                        w="50px"
                        h="50px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="white"
                    >
                        <Image
                            src="/school-logo.png"
                            alt="School Logo"
                            width={50}
                            height={50}
                        />
                    </Box>

                    <IconButton
                        aria-label="Home"
                        variant="ghost"
                        _hover={{ bg: "blackAlpha.200" }}
                    >
                        <Home size={28} color="black" />
                    </IconButton>

                    <IconButton
                        aria-label="Schedule"
                        variant="solid"
                        bg="blackAlpha.200"
                        _hover={{ bg: "blackAlpha.300" }}
                    >
                        <Book size={28} color="black" />
                    </IconButton>
                </VStack>

                <VStack spaceY={6}>
                    <Menu.Root positioning={{ placement: "right" }}>
                        <Menu.Trigger asChild>
                            <IconButton
                                aria-label="Change Language"
                                variant="ghost"
                                _hover={{ bg: "blackAlpha.200" }}
                                cursor="pointer"
                            >
                                <Globe size={28} color="black" />
                            </IconButton>
                        </Menu.Trigger>

                        <Menu.Content>
                            <Menu.Item
                                value="id"
                                onClick={() => {
                                    changeLocale("id");
                                }}
                                fontWeight={locale === "id" ? "bold" : "normal"}
                                cursor="pointer"
                            >
                                Bahasa Indonesia
                            </Menu.Item>
                            <Menu.Item
                                value="en"
                                onClick={() => {
                                    changeLocale("en");
                                }}
                                fontWeight={locale === "en" ? "bold" : "normal"}
                                cursor="pointer"
                            >
                                English
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Root>

                    <Menu.Root
                        positioning={{
                            placement: "right-end",
                            offset: { mainAxis: 20 },
                        }}
                    >
                        <Menu.Trigger asChild>
                            <Box cursor="pointer">
                                <Avatar
                                    size="sm"
                                    name="Reza"
                                    src="/pas-foto.jpg"
                                    border="2px solid white"
                                    _hover={{ opacity: 0.8 }}
                                />
                            </Box>
                        </Menu.Trigger>

                        <Menu.Positioner zIndex={1500}>
                            <Menu.Content minW="150px">
                                <Menu.Item
                                    value="settings"
                                    asChild
                                    cursor="pointer"
                                >
                                    <Link href="/settings">
                                        {t("accountSettings")}
                                    </Link>
                                </Menu.Item>

                                <Menu.Item
                                    value="logout"
                                    asChild
                                    color="red.500"
                                    cursor="pointer"
                                >
                                    <Link href="/logout">{t("logout")}</Link>
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Menu.Root>
                </VStack>
            </VStack>

            <Flex flex={1} direction="column" overflow="hidden">
                {props.children}
            </Flex>
        </Flex>
    );
}
