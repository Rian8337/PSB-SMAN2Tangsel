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
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropsWithChildren, useState } from "react";
import { Avatar } from "../ui/avatar";
import { useAuthApiClient } from "@/providers/api/auth-api-provider";
import { toaster } from "../ui/toaster";
import LocaleSwitcher from "@/components/LocaleSwitcher";

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
    readonly sidebarExtra?: React.ReactNode;
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
    const tGlobal = useTranslations("Global");
    const authApiClient = useAuthApiClient();
    const router = useRouter();
    const pathname = usePathname();

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
            <VStack w="full" alignItems={{ base: "stretch", md: "center" }} gap={{ base: 1, md: 8 }}>
                {!isDesktop ? (
                    <HStack
                        w="full"
                        px={4}
                        pb={3}
                        gap={3}
                        borderBottom="1px solid"
                        borderColor="blackAlpha.200"
                    >
                        <Box
                            w="36px"
                            h="36px"
                            borderRadius="full"
                            overflow="hidden"
                            bg="white"
                            flexShrink={0}
                        >
                            <Image
                                src="/school-logo.png"
                                alt="School Logo"
                                w="full"
                                h="full"
                                objectFit="contain"
                            />
                        </Box>

                        <Text fontWeight="bold" fontSize="sm" lineHeight="short">
                            {tGlobal("appName")}
                        </Text>
                    </HStack>
                ) : (
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
                            w="full"
                            h="full"
                            objectFit="contain"
                        />
                    </Box>
                )}

                {props.sidebarExtra && (
                    <Box px={2}>{props.sidebarExtra}</Box>
                )}

                {props.navItems.map((item) => {
                    const active = isActive(item.href, item.exact ?? false);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                        >
                            {isDesktop ? (
                                <IconButton
                                    aria-label={item.label}
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                    variant={active ? "solid" : "ghost"}
                                    bg={
                                        active
                                            ? "blackAlpha.200"
                                            : "transparent"
                                    }
                                    _hover={{ bg: "blackAlpha.300" }}
                                >
                                    <item.icon size={28} color="black" />
                                </IconButton>
                            ) : (
                                <Flex
                                    align="center"
                                    gap={3}
                                    mx={2}
                                    px={3}
                                    py={2}
                                    borderRadius="md"
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                    bg={
                                        active
                                            ? "blackAlpha.200"
                                            : "transparent"
                                    }
                                    _hover={{ bg: "blackAlpha.300" }}
                                >
                                    <item.icon size={22} color="black" />
                                    <Text
                                        fontWeight={
                                            active ? "bold" : "medium"
                                        }
                                        fontSize="sm"
                                    >
                                        {item.label}
                                    </Text>
                                </Flex>
                            )}
                        </Link>
                    );
                })}
            </VStack>

            <VStack spaceY={6} pb={2}>
                <LocaleSwitcher
                    menuPlacement={isDesktop ? "right" : "top"}
                />

                <Menu.Root
                    positioning={{
                        placement: isDesktop ? "right-end" : "top-end",
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
                                color="red.500"
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
                                w="32px"
                                h="32px"
                                objectFit="contain"
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

                <Box flex={1} overflowY="auto" pb={8}>
                    {props.children}
                </Box>
            </Flex>
        </Flex>
    );
}
