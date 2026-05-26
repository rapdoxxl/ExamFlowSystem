import { clearSession } from "@/lib/auth";
import { jsonOk } from "@/lib/response";

export async function POST() {
  await clearSession();
  return jsonOk({});
}
