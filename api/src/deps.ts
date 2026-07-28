/**
 * Production dependency wiring (Prisma + config + chain reader).
 * Routes import the singleton deps; factories stay internal.
 */

import { RecordStatus, type PrismaClient } from "@prisma/client";
import { prisma } from "./db/prisma";
import { config, type AppConfig } from "./config";
import { createOnChainHashReader } from "./chain/getOnChainHash";
import type { RecordLookups } from "./validation/validateRecord";
import type { SaveRecordInput, SubmitDeps } from "./services/submitRecord";
import type { ListRecordsDeps } from "./services/listRecords";
import type { VerifyDeps } from "./services/verifyRecord";
import type { RetryDeps } from "./services/retryRecord";
import type { DbRecord } from "./services/recordDto";

function createRecordLookups(db: PrismaClient): RecordLookups {
  return {
    async findLastAnchoredOdometer(vin: string): Promise<number | null> {
      const row = await db.record.findFirst({
        where: { vin, status: RecordStatus.anchored },
        orderBy: { completedAt: "desc" },
        select: { odometerMiles: true },
      });
      return row?.odometerMiles ?? null;
    },

    async recordIdExists(recordId: string): Promise<boolean> {
      const row = await db.record.findUnique({
        where: { recordId },
        select: { id: true },
      });
      return row !== null;
    },
  };
}

async function getById(db: PrismaClient, id: string): Promise<DbRecord | null> {
  return db.record.findUnique({ where: { id } });
}

async function insertAudit(
  db: PrismaClient,
  recordUuid: string,
  action: string,
  details?: object
): Promise<void> {
  await db.auditLog.create({
    data: {
      recordUuid,
      action,
      details: details ?? undefined,
    },
  });
}

function createSubmitDeps(db: PrismaClient, appConfig: AppConfig): SubmitDeps {
  return {
    lookups: createRecordLookups(db),
    config: { publicWebBaseUrl: appConfig.publicWebBaseUrl },

    async saveRecord(input: SaveRecordInput) {
      const row = await db.record.create({
        data: {
          recordId: input.recordId,
          vin: input.vin,
          serviceType: input.serviceType,
          odometerMiles: input.odometerMiles,
          completedAt: input.completedAt,
          shopName: input.shopName,
          source: input.source,
          canonicalJson: input.canonicalJson,
          contentHash: input.contentHash,
          status: RecordStatus.pending_anchor,
        },
        select: { id: true, recordId: true, status: true },
      });
      return {
        id: row.id,
        recordId: row.recordId,
        status: "pending_anchor" as const,
      };
    },

    async writeAudit(recordUuid, action, details) {
      await insertAudit(db, recordUuid, action, details);
    },
  };
}

function createListRecordsDeps(db: PrismaClient, appConfig: AppConfig): ListRecordsDeps {
  return {
    config: {
      publicWebBaseUrl: appConfig.publicWebBaseUrl,
      explorerBaseUrl: appConfig.explorerBaseUrl,
    },

    async list({ vin, status, limit, offset }) {
      const where = {
        ...(vin ? { vin } : {}),
        ...(status ? { status: status as RecordStatus } : {}),
      };
      const [rows, total] = await Promise.all([
        db.record.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        db.record.count({ where }),
      ]);
      return { rows, total };
    },

    async getById(id) {
      return getById(db, id);
    },
  };
}

function createVerifyDeps(db: PrismaClient, appConfig: AppConfig): VerifyDeps {
  return {
    config: {
      publicWebBaseUrl: appConfig.publicWebBaseUrl,
      explorerBaseUrl: appConfig.explorerBaseUrl,
    },
    getOnChainHash: createOnChainHashReader({
      contractAddress: appConfig.contractAddress,
      rpcUrl: process.env.RPC_URL,
    }),

    async getById(id) {
      return getById(db, id);
    },

    async getByRecordId(recordId) {
      return db.record.findUnique({ where: { recordId } });
    },
  };
}

function createRetryDeps(db: PrismaClient): RetryDeps {
  return {
    async getById(id) {
      return getById(db, id);
    },

    async resetForRetry(id) {
      return db.record.update({
        where: { id },
        data: {
          status: RecordStatus.pending_anchor,
          retryCount: 0,
          txHash: null,
          txSubmittedAt: null,
          anchoredAt: null,
        },
      });
    },

    async writeAudit(recordUuid, action, details) {
      await insertAudit(db, recordUuid, action, details);
    },
  };
}

/** Singletons used by Express routes. */
export const submitDeps: SubmitDeps = createSubmitDeps(prisma, config);
export const listRecordsDeps: ListRecordsDeps = createListRecordsDeps(prisma, config);
export const verifyDeps: VerifyDeps = createVerifyDeps(prisma, config);
export const retryDeps: RetryDeps = createRetryDeps(prisma);
