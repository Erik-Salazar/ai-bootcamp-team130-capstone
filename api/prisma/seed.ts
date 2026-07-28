/**
 * Local demo / validation seed.
 * Idempotent: upserts by business key `record_id`.
 *
 * Includes an anchored baseline for VIN 1FUJGHDV8CLBR1234 (V5 mileage checks)
 * plus ~10 joint-demo rows across statuses for the dashboard/worker.
 */
import "dotenv/config";
import { PrismaClient, RecordSource, RecordStatus } from "@prisma/client";
import {
  hashRecord,
  toCanonicalJson,
  type MaintenanceRecord,
} from "@maintnotary/shared";

const prisma = new PrismaClient();

type SeedRecord = {
  record: MaintenanceRecord;
  status: RecordStatus;
  txHash?: string;
  txSubmittedAt?: Date;
  anchoredAt?: Date;
  retryCount?: number;
};

const VIN_104 = "1FUJGHDV8CLBR1234";
const VIN_ALT = "1HGCM82633A004352";

function record(
  partial: Omit<MaintenanceRecord, "schema_version" | "source"> & {
    source?: "manual" | "import";
  }
): MaintenanceRecord {
  return {
    schema_version: "1.0",
    source: partial.source ?? "manual",
    ...partial,
  };
}

const seeds: SeedRecord[] = [
  {
    record: record({
      record_id: "wo-seed-anchored-001",
      vin: VIN_104,
      equipment_label: "Truck 104",
      service_type: "PM-A",
      completed_at: "2026-07-01T14:22:00Z",
      odometer_miles: 140000,
      shop_name: "In-house shop",
      notes: "Anchored baseline (earlier) for Truck 104",
    }),
    status: RecordStatus.anchored,
    txHash: "0xseed000000000000000000000000000000000000000000000000000000000001",
    txSubmittedAt: new Date("2026-07-01T14:23:00Z"),
    anchoredAt: new Date("2026-07-01T14:25:00Z"),
  },
  {
    record: record({
      record_id: "wo-seed-anchored-002",
      vin: VIN_104,
      equipment_label: "Truck 104",
      service_type: "PM-B",
      completed_at: "2026-07-08T14:22:00Z",
      odometer_miles: 142318,
      shop_name: "In-house shop",
      notes: "Latest anchored for V5 — last odometer 142318",
    }),
    status: RecordStatus.anchored,
    txHash: "0xseed000000000000000000000000000000000000000000000000000000000002",
    txSubmittedAt: new Date("2026-07-08T14:23:00Z"),
    anchoredAt: new Date("2026-07-08T14:25:00Z"),
  },
  {
    record: record({
      record_id: "wo-seed-pending-001",
      vin: VIN_104,
      equipment_label: "Truck 104",
      service_type: "Brake Service",
      completed_at: "2026-07-15T10:00:00Z",
      odometer_miles: 143000,
      shop_name: "In-house shop",
      notes: "Pending anchor — worker should pick up",
    }),
    status: RecordStatus.pending_anchor,
  },
  {
    record: record({
      record_id: "wo-seed-pending-002",
      vin: VIN_ALT,
      equipment_label: "Van 12",
      service_type: "DOT Annual",
      completed_at: "2026-07-16T09:00:00Z",
      odometer_miles: 88000,
      shop_name: "Fleet Depot",
      notes: "Second VIN pending",
      source: "import",
    }),
    status: RecordStatus.pending_anchor,
  },
  {
    record: record({
      record_id: "wo-seed-pending-003",
      vin: VIN_ALT,
      equipment_label: "Van 12",
      service_type: "Oil Change",
      completed_at: "2026-07-18T11:30:00Z",
      odometer_miles: 88500,
      shop_name: "Fleet Depot",
      notes: "Demo pending row 3",
    }),
    status: RecordStatus.pending_anchor,
  },
  {
    record: record({
      record_id: "wo-seed-tx-001",
      vin: VIN_104,
      equipment_label: "Truck 104",
      service_type: "Tire Rotation",
      completed_at: "2026-07-19T08:00:00Z",
      odometer_miles: 143200,
      shop_name: "In-house shop",
      notes: "tx_submitted sample",
    }),
    status: RecordStatus.tx_submitted,
    txHash: "0xseed0000000000000000000000000000000000000000000000000000000000aa",
    txSubmittedAt: new Date("2026-07-19T08:05:00Z"),
  },
  {
    record: record({
      record_id: "wo-seed-failed-001",
      vin: VIN_ALT,
      equipment_label: "Van 12",
      service_type: "PM-A",
      completed_at: "2026-07-12T16:00:00Z",
      odometer_miles: 87000,
      shop_name: "Partner Garage",
      notes: "anchor_failed — use Retry in UI",
    }),
    status: RecordStatus.anchor_failed,
    txHash: "0xseedfail0000000000000000000000000000000000000000000000000000001",
    txSubmittedAt: new Date("2026-07-12T16:05:00Z"),
    retryCount: 3,
  },
  {
    record: record({
      record_id: "wo-seed-anchored-003",
      vin: VIN_ALT,
      equipment_label: "Van 12",
      service_type: "Brake Service",
      completed_at: "2026-06-20T12:00:00Z",
      odometer_miles: 85000,
      shop_name: "Partner Garage",
      notes: "Historical anchored for Van 12",
    }),
    status: RecordStatus.anchored,
    txHash: "0xseed000000000000000000000000000000000000000000000000000000000003",
    txSubmittedAt: new Date("2026-06-20T12:05:00Z"),
    anchoredAt: new Date("2026-06-20T12:10:00Z"),
  },
  {
    record: record({
      record_id: "wo-seed-pending-004",
      vin: VIN_104,
      equipment_label: "Truck 104",
      service_type: "PM-A",
      completed_at: "2026-07-20T07:00:00Z",
      odometer_miles: 143500,
      shop_name: "In-house shop",
      notes: "Demo pending row 4",
      source: "import",
    }),
    status: RecordStatus.pending_anchor,
  },
  {
    record: record({
      record_id: "wo-seed-pending-005",
      vin: VIN_ALT,
      equipment_label: "Van 12",
      service_type: "PM-B",
      completed_at: "2026-07-21T13:15:00Z",
      odometer_miles: 89000,
      shop_name: "Fleet Depot",
      notes: "Tenth demo record for joint walkthrough",
    }),
    status: RecordStatus.pending_anchor,
  },
];

async function upsertSeed(seed: SeedRecord): Promise<void> {
  const { record, status, txHash, txSubmittedAt, anchoredAt, retryCount } = seed;
  const canonicalJson = JSON.parse(toCanonicalJson(record)) as object;
  const contentHash = hashRecord(record);

  const existing = await prisma.record.findUnique({
    where: { recordId: record.record_id },
    select: { id: true },
  });

  if (existing) {
    await prisma.record.update({
      where: { recordId: record.record_id },
      data: {
        vin: record.vin,
        serviceType: record.service_type,
        odometerMiles: record.odometer_miles,
        completedAt: new Date(record.completed_at),
        shopName: record.shop_name,
        source: record.source as RecordSource,
        canonicalJson,
        contentHash,
        status,
        txHash: txHash ?? null,
        txSubmittedAt: txSubmittedAt ?? null,
        anchoredAt: anchoredAt ?? null,
        retryCount: retryCount ?? 0,
      },
    });
    return;
  }

  await prisma.record.create({
    data: {
      recordId: record.record_id,
      vin: record.vin,
      serviceType: record.service_type,
      odometerMiles: record.odometer_miles,
      completedAt: new Date(record.completed_at),
      shopName: record.shop_name,
      source: record.source as RecordSource,
      canonicalJson,
      contentHash,
      status,
      txHash: txHash ?? null,
      txSubmittedAt: txSubmittedAt ?? null,
      anchoredAt: anchoredAt ?? null,
      retryCount: retryCount ?? 0,
      auditLogs: {
        create: [
          { action: "submitted", details: { seed: true } },
          { action: "validated", details: { seed: true } },
          {
            action:
              status === RecordStatus.anchored
                ? "anchored"
                : status === RecordStatus.anchor_failed
                  ? "anchor_failed"
                  : status === RecordStatus.tx_submitted
                    ? "tx_submitted"
                    : "anchor_queued",
            details: { seed: true },
          },
        ],
      },
    },
  });
}

async function main(): Promise<void> {
  for (const seed of seeds) {
    await upsertSeed(seed);
    console.log(`Seeded ${seed.record.record_id} (${seed.status})`);
  }
  console.log(`Done — ${seeds.length} demo records.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
