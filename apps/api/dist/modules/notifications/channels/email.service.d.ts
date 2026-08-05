export declare class EmailService {
    private readonly logger;
    private sesClient;
    private readonly defaultFrom;
    constructor();
    send(params: {
        to: string;
        subject: string;
        html: string;
    }): Promise<boolean>;
}
