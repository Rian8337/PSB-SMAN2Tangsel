/**
 * The days of the week for schedules.
 */
export enum ScheduleDay {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
}

/**
 * Schedule data transferred between frontend and backend.
 */
export interface ScheduleDTO {
    readonly id: number;
    readonly day: ScheduleDay;
    readonly startTime: number;
    readonly endTime: number;
    readonly subject: {
        readonly code: string;
        readonly name: string;
    };
}
