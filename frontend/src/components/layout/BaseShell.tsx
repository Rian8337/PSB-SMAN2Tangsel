"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
    Box,
    Flex,
    HStack,
    IconButton,
    Image,
    Menu,
    Text,
    useBreakpointValue,
    VStack,
} from "@chakra-ui/react";
import { Globe, MenuIcon } from "lucide-react";
import { Locale, useLocale, useTranslations } from "next-intl";
import { PropsWithChildren, useState } from "react";
import { Avatar } from "../ui/avatar";
import { useAuthApiClient } from "@/providers/api/auth-api-provider";
import { toaster } from "../ui/toaster";

export interface NavItem {
    readonly label: string;
    readonly icon: React.ElementType;
    readonly href: string;
    readonly exact?: boolean;
}

export interface BaseShellProps extends PropsWithChildren {
    readonly navItems: NavItem[];
    readonly mobileTitle: string;
    readonly userName: string;
    readonly userAvatar?: string;
    readonly settingsHref: string;
}

function SidebarContent({
    isDesktop,
    onClose,
    props,
}: {
    isDesktop: boolean;
    onClose?: () => void;
    props: BaseShellProps;
}) {
    const t = useTranslations("BaseShell");
    const authApiClient = useAuthApiClient();
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    function changeLocale(nextLocale: Locale) {
        router.replace({ pathname }, { locale: nextLocale });
    }

    function logout() {
        authApiClient
            .logout()
            .then(() => {
                router.push("/login");
            })
            .catch(() => {
                toaster.create({
                    title: t("logoutErrorTitle"),
                    description: t("logoutErrorMessage"),
                    type: "error",
                });
            });
    }

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <VStack
            w={{ base: "250px", md: "80px" }}
            h="full"
            bg="#B2CFF6"
            py={6}
            justifyContent="space-between"
            alignItems="center"
            boxShadow="sm"
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

                {props.navItems.map((item) => {
                    const active = isActive(item.href, item.exact ?? false);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                        >
                            <Flex
                                align="center"
                                justify="center"
                                px={{ base: 4, md: 0 }}
                                w={{ base: "full", md: "auto" }}
                            >
                                <IconButton
                                    aria-label={item.label}
                                    aria-current={active ? "page" : undefined}
                                    variant={active ? "solid" : "ghost"}
                                    bg={
                                        active
                                            ? "blackAlpha.200"
                                            : "transparent"
                                    }
                                    _hover={{ bg: "blackAlpha.300" }}
                                    w={{ base: "full", md: "auto" }}
                                    justifyContent={{
                                        base: "flex-start",
                                        md: "center",
                                    }}
                                >
                                    <item.icon size={28} color="black" />
                                    {!isDesktop && (
                                        <Text
                                            ml={4}
                                            fontWeight={
                                                active ? "bold" : "medium"
                                            }
                                        >
                                            {item.label}
                                        </Text>
                                    )}
                                </IconButton>
                            </Flex>
                        </Link>
                    );
                })}
            </VStack>

            <VStack spaceY={6}>
                <Menu.Root
                    positioning={{
                        placement: isDesktop ? "right" : "top",
                        offset: { mainAxis: 20 },
                    }}
                >
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

                    <Menu.Positioner zIndex={1500}>
                        <Menu.Content minW="150px">
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
                    </Menu.Positioner>
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
                                name={props.userName}
                                src={props.userAvatar}
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
                                <Link href={props.settingsHref}>
                                    {t("settings")}
                                </Link>
                            </Menu.Item>
                            <Menu.Item
                                value="logout"
                                cursor="pointer"
                                onClick={logout}
                            >
                                {t("logout")}
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Menu.Root>
            </VStack>
        </VStack>
    );
}

export function BaseShell(props: BaseShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isDesktop = useBreakpointValue({ base: false, md: true }) ?? true;

    return (
        <Flex h="100dvh" w="full" overflow="hidden" bg="gray.50">
            {isDesktop && <SidebarContent isDesktop props={props} />}

            {!isDesktop && isMobileMenuOpen && (
                <Box position="fixed" inset={0} zIndex={40}>
                    <Box
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.600"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                        }}
                    />
                    <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        zIndex={50}
                        bg="#B2CFF6"
                        shadow="xl"
                    >
                        <SidebarContent
                            isDesktop={false}
                            onClose={() => {
                                setIsMobileMenuOpen(false);
                            }}
                            props={props}
                        />
                    </Box>
                </Box>
            )}

            <Flex flex={1} direction="column" overflow="hidden">
                {!isDesktop && (
                    <Flex
                        h="16"
                        bg="#B2CFF6"
                        align="center"
                        px={4}
                        justify="space-between"
                        flexShrink={0}
                        shadow="sm"
                    >
                        <HStack spaceX={3}>
                            <Image
                                src="/school-logo.png"
                                alt="School Logo"
                                width={32}
                                height={32}
                            />
                            <Text fontWeight="bold">{props.mobileTitle}</Text>
                        </HStack>

                        <IconButton
                            aria-label="Menu"
                            variant="ghost"
                            onClick={() => {
                                setIsMobileMenuOpen(true);
                            }}
                        >
                            <MenuIcon size={24} color="black" />
                        </IconButton>
                    </Flex>
                )}

                <Box flex={1} overflowY="auto">
                    {props.children}
                </Box>
            </Flex>
        </Flex>
    );
}
