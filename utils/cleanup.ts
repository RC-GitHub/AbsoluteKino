import { Op } from "sequelize";

import { Reservation, User } from "../src/models"; 
import * as Constants from "../src/constants";

export async function cleanUpExpiredReservations(): Promise<number | undefined> {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - Constants.CLEANUP_RESERVATION_INTERVAL * 60 * 1000);
        
        return await Reservation.destroy({
            where: {
                type: Constants.RESERVATION_TYPES[0], 
                createdAt: { [Op.lt]: fifteenMinutesAgo }
            }
        });
    } catch (error: any) {
        console.error("[CLEAN-UP ERROR] Reservations:", error);
    }
}

export async function cleanUpGuestUsers(): Promise<number | undefined> {
    try {
        const oneHourAgo = new Date(Date.now() - Constants.CLEANUP_USER_INTERVAL * 60 * 1000);
        
        return await User.destroy({
            where: {
                accountType: Constants.USER_ACC_TYPES[0],
                createdAt: { [Op.lt]: oneHourAgo }
            }
        });
    } catch (error: any) {
        console.error("[CLEAN-UP ERROR] Users:", error);
    }
}