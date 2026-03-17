"use client";

import { Box, Flex, IconButton, VStack } from "@chakra-ui/react";
import { Book, Globe, Home } from "lucide-react";
import Image from "next/image";
import { PropsWithChildren } from "react";
import { Avatar } from "../ui/avatar";

export function DashboardShell(props: PropsWithChildren) {
    return (
        <Flex h="100vh" w="100vw" overflow="hidden" bg="white">
            {/* Sidebar */}
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
                    {/* School Logo */}
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

                    {/* Top Navigation Icons */}
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

                {/* Bottom Navigation Icons */}
                <VStack spaceY={6}>
                    <IconButton
                        aria-label="Change Language"
                        variant="ghost"
                        _hover={{ bg: "blackAlpha.200" }}
                    >
                        <Globe size={28} color="black" />
                    </IconButton>

                    {/* User Avatar */}
                    <Avatar
                        size="sm"
                        name="Reza"
                        src="/pas-foto.jpg"
                        border="2px solid white"
                    />
                </VStack>
            </VStack>

            {/* Main Content */}
            <Flex flex={1} direction="column" overflow="hidden">
                {props.children}
            </Flex>
        </Flex>
    );
}
