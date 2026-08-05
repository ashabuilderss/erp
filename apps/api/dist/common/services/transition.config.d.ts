export type StatusEnum = Record<string, string[]>;
export interface TransitionRule {
    entityName: string;
    prismaModel: string;
    transitions: StatusEnum;
    ownershipField?: string;
}
export declare const TRANSITION_RULES: TransitionRule[];
