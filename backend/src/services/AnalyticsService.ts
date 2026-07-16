import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAnalyticsRepository } from "@/repositories";
import {
    DownloadAnalytics,
    SubmissionAnalytics,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAnalyticsService } from "./IAnalyticsService";

@Injectable(dependencyTokens.analyticsService)
export class AnalyticsService implements IAnalyticsService {
    constructor(
        @inject(dependencyTokens.analyticsRepository)
        private readonly analyticsRepository: IAnalyticsRepository,
    ) {}

    async getDownloadAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        topLimit: number,
    ): Promise<DownloadAnalytics> {
        const [timeSeries, topAttachments] = await Promise.all([
            this.analyticsRepository.getDownloadTimeSeries(
                teacherId,
                session,
                semester,
            ),
            this.analyticsRepository.getTopDownloadedAttachments(
                teacherId,
                session,
                semester,
                topLimit,
            ),
        ]);

        return { timeSeries, topAttachments };
    }

    async getSubmissionAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        concernLimit: number,
    ): Promise<SubmissionAnalytics> {
        return this.analyticsRepository.getSubmissionAnalytics(
            teacherId,
            session,
            semester,
            concernLimit,
        );
    }
}
