"use client";

import { useNotifications } from "@/hooks";
import { useRouter } from "@/i18n/navigation";
import {
    Box,
    HStack,
    IconButton,
    Popover,
    Text,
    VStack,
} from "@chakra-ui/react";
import { Bell, CheckCircle2, Circle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function NotificationBell() {
    const t = useTranslations("NotificationBell");
    const router = useRouter();
    const locale = useLocale();
    const { notifications, unreadCount, updateReadStatus } = useNotifications();

    return (
        <Popover.Root lazyMount positioning={{ placement: "bottom-end" }}>
            <Popover.Trigger asChild>
                <Box
                    position="relative"
                    display="inline-block"
                    cursor="pointer"
                >
                    <IconButton aria-label="Notifications" variant="ghost">
                        <Bell
                            size={28}
                            color="black"
                            fill={unreadCount > 0 ? "black" : "none"}
                        />
                    </IconButton>

                    {unreadCount > 0 && (
                        <Box
                            position="absolute"
                            top={1}
                            right={1}
                            pointerEvents="none"
                            bg="red.500"
                            color="white"
                            fontSize="xs"
                            fontWeight="bold"
                            borderRadius="full"
                            w={5}
                            h={5}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="2px solid white"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Box>
                    )}
                </Box>
            </Popover.Trigger>

            <Popover.Positioner>
                <Popover.Content
                    border="2px solid black"
                    boxShadow="4px 4px 0px black"
                    bg="white"
                    w={{ base: "calc(100vw - 32px)", sm: 350 }}
                    maxW="100vw"
                >
                    <Popover.Arrow>
                        <Popover.ArrowTip />
                    </Popover.Arrow>

                    <Popover.Body
                        p={0}
                        maxH={{ base: "60vh", sm: 400 }}
                        overflowY="auto"
                    >
                        <Box
                            borderBottom="2px solid black"
                            p={3}
                            bg="white"
                            position="sticky"
                            top={0}
                            zIndex={1}
                        >
                            <Popover.Title fontWeight="bold" color="black">
                                {t("title")}
                            </Popover.Title>
                        </Box>

                        {notifications.length === 0 ? (
                            <Text p={4} textAlign="center" color="gray.500">
                                {t("noNotifications")}
                            </Text>
                        ) : (
                            <VStack
                                align="stretch"
                                gap={0}
                                separator={
                                    <Box
                                        borderBottom="1px solid"
                                        borderColor="gray.200"
                                    />
                                }
                            >
                                {notifications.map((n) => (
                                    <Box
                                        key={n.id}
                                        p={4}
                                        bg={n.read ? "white" : "blue.50"}
                                        transition="background 0.2s"
                                        cursor={n.url ? "pointer" : "default"}
                                        _hover={
                                            n.url
                                                ? {
                                                      bg: n.read
                                                          ? "gray.50"
                                                          : "blue.100",
                                                  }
                                                : undefined
                                        }
                                        onClick={() => {
                                            if (n.url) {
                                                router.push(n.url);
                                            }
                                        }}
                                    >
                                        <HStack
                                            justify="space-between"
                                            align="flex-start"
                                            mb={1}
                                        >
                                            <Text
                                                fontWeight="bold"
                                                fontSize="sm"
                                                color="black"
                                            >
                                                {n.title}
                                            </Text>

                                            <IconButton
                                                aria-label={
                                                    n.read
                                                        ? "markAsUnread"
                                                        : "markAsRead"
                                                }
                                                size="xs"
                                                variant="ghost"
                                                color={
                                                    n.read
                                                        ? "gray.400"
                                                        : "blue.500"
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    void updateReadStatus(
                                                        n.id,
                                                        !n.read,
                                                    );
                                                }}
                                            >
                                                {n.read ? (
                                                    <CheckCircle2 size={16} />
                                                ) : (
                                                    <Circle size={16} />
                                                )}
                                            </IconButton>
                                        </HStack>
                                        <Text fontSize="sm" color="gray.700">
                                            {n.message}
                                        </Text>
                                        <Text
                                            fontSize="xs"
                                            color="gray.500"
                                            mt={2}
                                        >
                                            {new Date(
                                                n.createdAt,
                                            ).toLocaleDateString(locale, {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </Popover.Body>
                </Popover.Content>
            </Popover.Positioner>
        </Popover.Root>
    );
}
