import { handle } from "@/app/api/_shared";
import { ServiceError } from "@/lib/messages";
import { closeStaleMatches, staleMatchHours } from "@/lib/game/service";

export async function GET(request: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    const header = request.headers.get("authorization");

    if (secret && header !== `Bearer ${secret}`) {
      throw new ServiceError(401, "Essa chamada não é autorizada.");
    }

    return { closed: await closeStaleMatches(), afterHours: staleMatchHours };
  });
}
