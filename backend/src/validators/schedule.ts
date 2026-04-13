import { MessageKey } from "@/i18n";
import { ScheduleDay } from "@psb/shared/types";
import z from "zod";
import { classSubjectIdSchema } from "./classes";

const daySchema = z.enum(ScheduleDay, {
    error: "scheduleController.invalidDay" satisfies MessageKey,
});

const startTimeSchema = z.coerce.date({
    error: "scheduleController.invalidStartTime" satisfies MessageKey,
});

const endTimeSchema = z.coerce.date({
    error: "scheduleController.invalidEndTime" satisfies MessageKey,
});

const idError = {
    error: "scheduleController.invalidScheduleId" satisfies MessageKey,
};

/**
 * A Zod schema for validating the schedule ID parameter in the request path.
 */
export const scheduleIdSchema = z.object({
    id: z.coerce
        .number(idError)
        .refine((val) => Number.isInteger(val) && val > 0, idError),
});

/**
 * A Zod schema for validating the request body of a create schedule request.
 */
export const createScheduleSchema = z.object({
    classSubjectId: classSubjectIdSchema,
    day: daySchema,
    startTime: startTimeSchema,
    endTime: endTimeSchema,
});

/**
 * A Zod schema for validating the request body of an update schedule request.
 */
export const updateScheduleSchema = z.object({
    day: daySchema,
    startTime: startTimeSchema,
    endTime: endTimeSchema,
});
