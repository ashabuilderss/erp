import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret) throw new Error('ENCRYPTION_KEY or AUTH_SECRET must be set');
  return scryptSync(secret, 'encryption-salt', KEY_LENGTH);
}

function isAlreadyEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  return iv.length === IV_LENGTH && tag.length === 16;
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      where: { totpSecret: { not: null } },
      select: { id: true, email: true, totpSecret: true },
    });

    console.log(`Found ${users.length} users with totpSecret`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.totpSecret) continue;

      if (isAlreadyEncrypted(user.totpSecret)) {
        console.log(`  SKIP  ${user.email} — already encrypted`);
        skipped++;
        continue;
      }

      const encrypted = encrypt(user.totpSecret);
      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: encrypted },
      });

      console.log(`  OK    ${user.email} — encrypted`);
      migrated++;
    }

    console.log(`\nDone: ${migrated} migrated, ${skipped} already encrypted`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
