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
 * A Zod schema for validating a schedule ID.
 */
export const scheduleIdSchema = z
    .number(idError)
    .int(idError)
    .positive(idError);

/**
 * A Zod schema for validating a schedule ID that may be provided as a string and coerced to a number.
 */
export const coercedScheduleIdSchema = z.coerce
    .number(idError)
    .pipe(scheduleIdSchema);

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
