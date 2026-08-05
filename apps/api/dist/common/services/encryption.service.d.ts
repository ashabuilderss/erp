export declare class EncryptionService {
    private readonly key;
    constructor();
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
    encryptNumber(value: number): string;
    decryptNumber(encryptedText: string): number;
}
