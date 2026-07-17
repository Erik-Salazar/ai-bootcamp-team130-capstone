// Verify (`/verify/:id` or `/verify`) — spec §13.4
// TODO(Frontend): auto-load by ID via verifyById, or accept pasted/uploaded
// JSON via verifyJson. Clear "Verified" vs "Mismatch" messaging.
export default function Verify() {
  return (
    <section>
      <h2>Verify Record</h2>
      <p>Integrity check UI will go here.</p>
    </section>
  );
}
