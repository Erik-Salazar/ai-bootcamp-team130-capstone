-- Sample queries for MaintNotary local DB (maintnotary)

-- All records
SELECT record_id, vin, service_type, odometer_miles, status, created_at
FROM records
ORDER BY created_at;

-- Anchored baseline (V5)
SELECT record_id, vin, odometer_miles, anchored_at, content_hash
FROM records
WHERE status = 'anchored';

-- Pending queue (worker pickup)
SELECT record_id, vin, status, created_at
FROM records
WHERE status = 'pending_anchor'
ORDER BY created_at;

-- Audit trail
SELECT a.created_at, r.record_id, a.action, a.details
FROM audit_log a
JOIN records r ON r.id = a.record_uuid
ORDER BY a.created_at DESC
LIMIT 50;
