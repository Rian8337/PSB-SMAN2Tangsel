import { formatNotificationDate } from "@/utils/date";

describe("formatNotificationDate (unit)", () => {
    const now = new Date("2026-04-21T12:00:00Z").getTime();

    it("should return 'just now' for timestamps less than a minute old", () => {
        const timestamp = now - 30 * 1000;

        expect(formatNotificationDate(timestamp, "en", now)).toBe("now");
    });

    it("should return 'just now' for timestamps slightly in the future", () => {
        const timestamp = now + 10 * 1000;

        expect(formatNotificationDate(timestamp, "en", now)).toBe("now");
    });

    it("should return a relative time in minutes for timestamps less than an hour old", () => {
        const timestamp = now - 5 * 60 * 1000;

        expect(formatNotificationDate(timestamp, "en", now)).toBe(
            "5 minutes ago",
        );
    });

    it("should return a relative time in hours for timestamps less than a day old", () => {
        const timestamp = now - 3 * 60 * 60 * 1000;

        expect(formatNotificationDate(timestamp, "en", now)).toBe(
            "3 hours ago",
        );
    });

    it("should return an absolute date for timestamps a day old or more", () => {
        const timestamp = new Date("2026-04-19T09:30:00Z").getTime();

        expect(formatNotificationDate(timestamp, "en", now)).toBe(
            new Date(timestamp).toLocaleDateString("en", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
        );
    });

    it("should localize relative time according to the given locale", () => {
        const timestamp = now - 5 * 60 * 1000;

        expect(formatNotificationDate(timestamp, "id", now)).toBe(
            "5 menit yang lalu",
        );
    });
});
