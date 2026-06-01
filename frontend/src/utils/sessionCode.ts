import { validSemesterSchema, validSessionSchema } from "@psb/shared/validator";
import { UserSessionDTO, ValidSemester, ValidSession } from "@psb/shared/types";

/**
 * Encodes a session/semester pair into a compact 5-character URL segment.
 *
 * Format: `{YY1}{YY2}{S}` where YY1/YY2 are the last two digits of each year
 * and S is the semester digit (1 or 2).
 *
 * Example: "2024/2025" semester 2 --> "24252"
 */
export function encodeSessionCode(
    session: ValidSession,
    semester: ValidSemester,
): string {
    const [y1, y2] = session.split("/");

    return `${y1.slice(-2)}${y2.slice(-2)}${semester.toString()}`;
}

/**
 * Decodes a 5-character session code back into a session/semester pair.
 * Returns `null` if the code is not in the expected format.
 *
 * Example: "24252" --> { session: "2024/2025", semester: 2 }
 */
export function decodeSessionCode(code: string): UserSessionDTO | null {
    if (!/^\d{5}$/.test(code)) {
        return null;
    }

    const year1 = 2000 + parseInt(code.slice(0, 2), 10);
    const year2 = 2000 + parseInt(code.slice(2, 4), 10);
    const s = parseInt(code.slice(4), 10);

    const sessionResult = validSessionSchema.safeParse(
        `${year1.toString()}/${year2.toString()}`,
    );

    const semesterResult = validSemesterSchema.safeParse(s);

    if (!sessionResult.success || !semesterResult.success) {
        return null;
    }

    return { session: sessionResult.data, semester: semesterResult.data };
}
