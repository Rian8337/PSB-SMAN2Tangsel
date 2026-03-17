"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { parseScheduleData } from "@/utils/schedule";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";

const DAYS = [
    { label: "Monday", value: ScheduleDay.monday },
    { label: "Tuesday", value: ScheduleDay.tuesday },
    { label: "Wednesday", value: ScheduleDay.wednesday },
    { label: "Thursday", value: ScheduleDay.thursday },
    { label: "Friday", value: ScheduleDay.friday },
];

const HOURS = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];

const ROW_HEIGHT_REM = 5;
const START_HOUR = 6;

interface ScheduleGridProps {
    data: ScheduleDTO[];
}

export function ScheduleGrid({ data }: ScheduleGridProps) {
    const parsedClasses = parseScheduleData(data);

    return (
        <Box border="1px solid black" bg="white" w="full" overflowX="auto">
            <Flex minW={{ base: "800px", lg: "100%" }}>
                <Box
                    w={{ base: "60px", md: "100px" }}
                    borderRight="1px solid black"
                >
                    <Box
                        h="50px"
                        borderBottom="1px solid black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text fontWeight="bold" color="black">
                            Time
                        </Text>
                    </Box>

                    {HOURS.map((hour) => (
                        <Box
                            key={hour}
                            h={`${ROW_HEIGHT_REM.toString()}rem`}
                            borderBottom="1px solid black"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text
                                fontWeight="bold"
                                color="black"
                                fontSize={{ base: "sm", md: "md" }}
                            >
                                {hour}
                            </Text>
                        </Box>
                    ))}
                </Box>

                {DAYS.map((day, dayIdx) => (
                    <Box
                        key={day.value}
                        flex={1}
                        borderRight={
                            dayIdx === DAYS.length - 1
                                ? "none"
                                : "1px solid black"
                        }
                    >
                        <Box
                            h="50px"
                            borderBottom="1px solid black"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text fontWeight="bold" color="black">
                                {day.label}
                            </Text>
                        </Box>

                        <Box
                            position="relative"
                            h={`${(HOURS.length * ROW_HEIGHT_REM).toString()}rem`}
                        >
                            {HOURS.map((_, i) => (
                                <Box
                                    key={i}
                                    h={`${ROW_HEIGHT_REM.toString()}rem`}
                                    borderBottom="1px solid black"
                                    w="full"
                                />
                            ))}

                            {parsedClasses
                                .filter((c) => c.day === day.value)
                                .map((cls) => {
                                    const topOffset =
                                        (cls.startDecimal - START_HOUR) *
                                        ROW_HEIGHT_REM;

                                    const height =
                                        (cls.endDecimal - cls.startDecimal) *
                                        ROW_HEIGHT_REM;

                                    return (
                                        <Box
                                            key={cls.id}
                                            position="absolute"
                                            top={`${topOffset.toString()}rem`}
                                            left="0"
                                            right="0"
                                            height={`${height.toString()}rem`}
                                            bg="#EFFF00"
                                            border="2px solid black"
                                            p={2}
                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                            justifyContent="center"
                                            zIndex={2}
                                            overflow="hidden"
                                        >
                                            <Text
                                                fontWeight="bold"
                                                color="#0000FF"
                                                textDecoration="underline"
                                                textAlign="center"
                                                fontSize={{
                                                    base: "sm",
                                                    md: "md",
                                                }}
                                            >
                                                {cls.subject.name}
                                            </Text>
                                        </Box>
                                    );
                                })}
                        </Box>
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}
