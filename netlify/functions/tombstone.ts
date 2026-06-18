import type { Handler } from "@netlify/functions";
import { getTombstone } from "./lib/tombstoneStore";

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const id = event.queryStringParameters?.id;
  if (!id) {
    return json(400, { error: "Missing tombstone id" });
  }

  const tombstone = await getTombstone(id);
  if (!tombstone) {
    return json(404, { error: "Tombstone not found" });
  }

  return json(200, { tombstone });
};
