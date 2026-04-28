import cron from "node-cron";
import { cleanUpExpiredReservations, cleanUpGuestUsers } from "./cleanup";

export function initCronJobs() {
    cron.schedule("*/5 * * * *", async () => {
        try {
            const count = await cleanUpExpiredReservations();
            if (count && count > 0) {
                console.log(`[CRON] 🧹 Cleaned up ${count} expired reservations.`);
            }
        } catch (error) {
            console.error("[CRON ERROR] Reservation cleanup failed:", error);
        }
    });

    cron.schedule("0 * * * *", async () => {
        try {
            const count = await cleanUpGuestUsers();
            if (count && count > 0) {
                console.log(`[CRON] 👤 Removed ${count} temporary guest accounts.`);
            }
        } catch (error) {
            console.error("[CRON ERROR] Guest cleanup failed:", error);
        }
    });

}