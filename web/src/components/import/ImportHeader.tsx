const EXAMPLE_WEBHOOK = `{
  "event": "work_order.completed",
  "payload": {
    "work_order_id": "wo-2026-0042",
    "vehicle_vin": "1M8GDM9AXKP042788",
    "vehicle_name": "Truck 104",
    "service_type": "PM-A",
    "completed_at": "2026-07-08T14:22:00Z",
    "odometer": 142318,
    "vendor_name": "In-house shop",
    "description": "Oil, filters, brake inspection"
  }
}`;

export default function ImportHeader() {
  return (
    <header className="page-header page-header--accent">
      <div>
        <h2>Import Webhook JSON</h2>
        <p className="page-subtitle">
          Paste a mock FMS webhook payload, preview the normalized record, then submit for anchoring.
        </p>
      </div>
    </header>
  );
}

export { EXAMPLE_WEBHOOK };
