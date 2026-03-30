"use client";

import { Link } from "@/i18n/navigation";
import { parseScheduleData } from "@/utils/schedule";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";

function getDayLabels(t: ReturnType<typeof useTranslations<"ScheduleGrid">>) {
    return [
        { label: t("monday"), value: ScheduleDay.monday },
        { label: t("tuesday"), value: ScheduleDay.tuesday },
        { label: t("wednesday"), value: ScheduleDay.wednesday },
        { label: t("thursday"), value: ScheduleDay.thursday },
        { label: t("friday"), value: ScheduleDay.friday },
    ];
}

const HOURS = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];

const ROW_HEIGHT_REM = 5;
const START_HOUR = 6;

interface ScheduleGridProps {
    data: ScheduleDTO[];
    editMode?: boolean;
}

export function ScheduleGrid({ data, editMode }: ScheduleGridProps) {
    const t = useTranslations("ScheduleGrid");
    const parsedClasses = parseScheduleData(data);
    const days = getDayLabels(t);

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
                            {t("time")}
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

                                    const text = (
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
                                    );

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
                                            {editMode ? (
                                                <Link
                                                    href={`/admin/schedules/edit/${cls.id.toString()}`}
                                                    style={{
                                                        display: "flex",
                                                        width: "100%",
                                                        height: "100%",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        padding: "0.5rem",
                                                    }}
                                                >
                                                    {text}
                                                </Link>
                                            ) : (
                                                <Flex
                                                    w="full"
                                                    h="full"
                                                    align="center"
                                                    justify="center"
                                                    p={2}
                                                >
                                                    {text}
                                                </Flex>
                                            )}
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
