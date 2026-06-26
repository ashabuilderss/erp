import * as fs from 'fs';
import * as os from 'os';
import { join, relative } from 'path';
import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  const uploadsDir = join(process.cwd(), 'uploads');
  let outsideDir: string;
  let outsideFile: string;

  beforeEach(() => {
    outsideDir = fs.mkdtempSync(join(os.tmpdir(), 'uploads-delete-'));
    outsideFile = join(outsideDir, 'outside.txt');
    fs.writeFileSync(outsideFile, 'keep me');
  });

  afterEach(() => {
    fs.rmSync(outsideDir, { recursive: true, force: true });
  });

  it.each([
    ['a traversal key', () => relative(uploadsDir, outsideFile)],
    ['an absolute key', () => outsideFile],
  ])('does not delete a file outside the uploads root via %s', async (_, key) => {
    const provider = new LocalStorageProvider();

    await provider.delete(key());

    expect(fs.existsSync(outsideFile)).toBe(true);
  });
});
