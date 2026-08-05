import { DomainEvent } from '@prisma/client';
import { HoldRecommendationService } from './hold-recommendation.service';
export declare class WarningThresholdBreachedListener {
    private readonly recommendationService;
    private readonly logger;
    constructor(recommendationService: HoldRecommendationService);
    handleWarningThresholdBreached(event: DomainEvent): Promise<void>;
}
