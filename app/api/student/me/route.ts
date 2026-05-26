import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.registration) return jsonError("未登录", 401);
  const settings = await getSettings();
  return jsonOk({ registration: { ...user.registration, class: user.class }, registrationOpen: settings.registrationOpen });
}
