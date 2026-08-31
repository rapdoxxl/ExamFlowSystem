import { getSettings } from "@/lib/data";
import { readPaymentQr } from "@/lib/paymentQr";

export async function GET() {
  const settings = await getSettings();
  const image = await readPaymentQr(settings.paymentQrPath);
  return new Response(image.buffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": image.contentType
    }
  });
}
