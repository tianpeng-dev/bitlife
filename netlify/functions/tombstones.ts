import type { Handler } from "@netlify/functions";
import { tombstoneInputSchema } from "./lib/tombstoneSchema";
import { listTombstones, saveTombstone } from "./lib/tombstoneStore";

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "GET") {
    const rows = await listTombstones();
    return json(200, { rows });
  }

  if (event.httpMethod === "POST") {
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const parsed = tombstoneInputSchema.safeParse(body);
    if (!parsed.success) {
      return json(400, { error: "Invalid tombstone" });
    }

    const tombstone = await saveTombstone(parsed.data);
    return json(200, { shareId: tombstone.id, tombstone });
  }

  return json(405, { error: "Method not allowed" });
};
