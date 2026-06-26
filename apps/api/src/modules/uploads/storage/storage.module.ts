import { Module, Global } from '@nestjs/common';
import { StorageProvider } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

const storageProviderFactory = {
  provide: 'STORAGE_PROVIDER',
  useFactory: () => {
    if (process.env.STORAGE_DRIVER === 's3') {
      return new S3StorageProvider();
    }
    return new LocalStorageProvider();
  },
};

@Global()
@Module({
  providers: [storageProviderFactory],
  exports: ['STORAGE_PROVIDER'],
})
export class StorageModule {}

export type { StorageProvider };
export { storageProviderFactory };
