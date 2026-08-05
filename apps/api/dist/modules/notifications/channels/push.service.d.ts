export declare class PushService {
    private readonly logger;
    private initialized;
    constructor();
    send(params: {
        token: string;
        title: string;
        body: string;
        data?: Record<string, string>;
    }): Promise<boolean>;
}
