"use client";

import { parseScheduleData } from "@/utils/schedule";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";

function getDayLabels(t: ReturnType<typeof useTranslations<"Day">>) {
    return [
        { label: t("monday"), value: ScheduleDay.monday },
        { label: t("tuesday"), value: ScheduleDay.tuesday },
        { label: t("wednesday"), value: ScheduleDay.wednesday },
        { label: t("thursday"), value: ScheduleDay.thursday },
        { label: t("friday"), value: ScheduleDay.friday },
    ];
}

const HOURS = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
];

const ROW_HEIGHT_REM = 5;
const START_HOUR = 6;

export interface ScheduleGridProps {
    readonly data: ScheduleDTO[];
    readonly editMode?: boolean;
    readonly onScheduleClick?: (scheduleId: number) => void;
    readonly maxHeight?: string | number;
}

export function ScheduleGrid({
    data,
    editMode,
    onScheduleClick,
    maxHeight = "600px",
}: ScheduleGridProps) {
    const t = useTranslations("Day");
    const parsedClasses = parseScheduleData(data);
    const days = getDayLabels(t);

    return (
        <Box
            border="1px solid black"
            bg="white"
            w="full"
            overflow="auto"
            maxH={maxHeight}
            position="relative"
        >
            <Flex minW={{ base: "800px", md: "100%" }} direction="column">
                <Flex position="sticky" top={0} zIndex={10} bg="white">
                    <Box
                        w={{ base: "60px", md: "100px" }}
                        h="50px"
                        borderRight="1px solid black"
                        borderBottom="1px solid black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        bg="white"
                        position="sticky"
                        left={0}
                        zIndex={11}
                    >
                        <Text fontWeight="bold" color="black">
                            {t("time")}
                        </Text>
                    </Box>

                    {days.map((day, dayIdx) => (
                        <Box
                            key={day.value}
                            flex={1}
                            h="50px"
                            borderRight={
                                dayIdx === days.length - 1
                                    ? "none"
                                    : "1px solid black"
                            }
                            borderBottom="1px solid black"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="white"
                        >
                            <Text fontWeight="bold" color="black">
                                {day.label}
                            </Text>
                        </Box>
                    ))}
                </Flex>

                <Flex>
                    <Box
                        w={{ base: "60px", md: "100px" }}
                        borderRight="1px solid black"
                        flexShrink={0}
                        position="sticky"
                        left={0}
                        bg="white"
                        zIndex={5}
                    >
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

                    {days.map((day, dayIdx) => (
                        <Box
                            key={day.value}
                            flex={1}
                            borderRight={
                                dayIdx === days.length - 1
                                    ? "none"
                                    : "1px solid black"
                            }
                        >
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
                                            (cls.endDecimal -
                                                cls.startDecimal) *
                                            ROW_HEIGHT_REM;

                                        return (
                                            <Box
                                                key={cls.id}
                                                as={editMode ? "button" : "div"}
                                                onClick={() =>
                                                    editMode &&
                                                    onScheduleClick?.(cls.id)
                                                }
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
                                                cursor={
                                                    editMode
                                                        ? "pointer"
                                                        : "default"
                                                }
                                                _hover={
                                                    editMode
                                                        ? {
                                                              bg: "#dadd00",
                                                              shadow: "md",
                                                          }
                                                        : undefined
                                                }
                                                transition="all 0.2s"
                                            >
                                                <Text
                                                    fontWeight="bold"
                                                    color="#0000FF"
                                                    textDecoration={
                                                        editMode
                                                            ? "underline"
                                                            : "none"
                                                    }
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
            </Flex>
        </Box>
    );
}
