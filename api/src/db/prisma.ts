import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client. The anchor worker (`worker/`) uses the same
 * generated client to read/write the `records` table (spec §7a, §15).
 */
export const prisma = new PrismaClient();
