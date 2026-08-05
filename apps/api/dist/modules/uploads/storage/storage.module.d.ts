import { StorageProvider } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
declare const storageProviderFactory: {
    provide: string;
    useFactory: () => LocalStorageProvider | S3StorageProvider;
};
export declare class StorageModule {
}
export type { StorageProvider };
export { storageProviderFactory };
