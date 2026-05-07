import "server-only";

import { handleAICoachRequest } from "@/controllers/aiController";

// App Router bridge so the /api/ai endpoint stays thin and the AI stack lives in src/.
export async function POST(request: Request) {
  return handleAICoachRequest(request);
}
