export declare class VerifyTwoFactorDto {
    token: string;
}
export declare class DisableTwoFactorDto {
    password: string;
}
export declare class AuthenticateTwoFactorDto {
    tempToken: string;
    code: string;
}
