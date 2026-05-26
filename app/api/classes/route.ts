import { jsonOk } from "@/lib/response";
import { listClasses } from "@/lib/data";

export async function GET() {
  return jsonOk(await listClasses());
}
