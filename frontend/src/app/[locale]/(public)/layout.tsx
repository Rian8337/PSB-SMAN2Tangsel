import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function PublicLayout({ children }: PropsWithChildren) {
    return (
        <Box minH="100vh" position="relative" bg="gray.50">
            <Box position="absolute" top={4} left={4} zIndex={10}>
                <LocaleSwitcher />
            </Box>

            <Box
                as="main"
                p={4}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minH="100vh"
            >
                {children}
            </Box>
        </Box>
    );
}
