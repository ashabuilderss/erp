import { PrismaService } from '../../config/prisma.service';
export declare function validateForeignKey(prisma: PrismaService, model: string, where: Record<string, unknown>, label: string): Promise<void>;
