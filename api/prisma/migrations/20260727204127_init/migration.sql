-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('pending_anchor', 'tx_submitted', 'anchored', 'anchor_failed');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('manual', 'import');

-- CreateTable
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "service_type" VARCHAR(64) NOT NULL,
    "odometer_miles" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "shop_name" VARCHAR(255) NOT NULL,
    "source" "RecordSource" NOT NULL,
    "canonical_json" JSONB NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'pending_anchor',
    "tx_hash" TEXT,
    "tx_submitted_at" TIMESTAMP(3),
    "anchored_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "record_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "records_record_id_key" ON "records"("record_id");

-- CreateIndex
CREATE INDEX "records_vin_idx" ON "records"("vin");

-- CreateIndex
CREATE INDEX "records_service_type_idx" ON "records"("service_type");

-- CreateIndex
CREATE INDEX "records_odometer_miles_idx" ON "records"("odometer_miles");

-- CreateIndex
CREATE INDEX "records_completed_at_idx" ON "records"("completed_at");

-- CreateIndex
CREATE INDEX "audit_log_record_uuid_idx" ON "audit_log"("record_uuid");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_record_uuid_fkey" FOREIGN KEY ("record_uuid") REFERENCES "records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
