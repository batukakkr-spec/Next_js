import { z } from "zod";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  setupCode: z.string().trim().min(1).max(255),
});

export async function claimAdmin({ data }: { data: unknown }) {
  const payload = Schema.parse(data);
  const response = await fetch("/api/admin/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as { error?: string; ok?: boolean; userId?: string };

  if (!response.ok) {
    throw new Error(result.error ?? "Failed to claim admin");
  }

  return result;
}
