import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import { 
    Reservation, ReservationAttributes, ReservationInstance, 
    Screening, ScreeningInstance, 
    Seat, SeatInstance, 
    User, UserInstance 
} from "../models.js";

const router = express.Router();

/**
 * Adds a new reservation.
 * Requires a reservation row, column, screening id and client id (user id)
 */
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { type, seatId, screeningId, userId }: ReservationAttributes = req.body;

        if (
            type == null || 
            seatId == null || 
            screeningId == null || 
            userId == null
        ) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        }

        if (
            typeof type !== 'number' || 
            typeof seatId !== 'number' || !Number.isInteger(seatId) ||
            typeof screeningId !== 'number' || !Number.isInteger(screeningId) ||
            typeof userId !== 'number' || !Number.isInteger(userId)
        ) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        }

        if (seatId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.SEAT_ERR_ID, reservations: [] });
        }
        if (screeningId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        }
        if (userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, reservations: [] });
        }

        if (!Constants.RESERVATION_TYPES.includes(type)) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
        }

        const seat: SeatInstance | null = await Seat.findByPk(seatId);
        if (!seat) {
            return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        }
        const screening: ScreeningInstance | null = await Screening.findByPk(screeningId);
        if (!screening) {
            return res.status(404).json({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        }
        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        }

        const existing = await Reservation.findOne({ where: { screeningId, seatId } });
        if (existing) {
            if (existing.type === Constants.RESERVATION_TYPES[0]) {
                return res.status(400).json({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });
            }
            else {
                return res.status(400).json({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
            }
        }

        const reservation = await Reservation.create({ 
            type,
            seatId,
            screeningId, 
            userId 
        });
        res.send({ reservations: [reservation] });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Fetches all reservations.
 */
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reservations: ReservationInstance[] = await Reservation.findAll();
        if (reservations.length === 0) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND_ALL, reservations: [] });
        }
        res.send({ reservations });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Fetches reservations for a specific screening.
 */
router.get("/all/screening/:screeningId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const screeningId: number = parseInt(req.params.screeningId.toString());
        if (isNaN(screeningId) || screeningId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        }

        const screening = await Screening.findByPk(screeningId);
        if (!screening) {
            return res.status(404).json({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        }

        const reservations = await Reservation.findAll({ where: { screeningId } });
        if (reservations.length === 0) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND_SCREENING, reservations: [] });
        }
        res.send({ reservations });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Fetches reservations for a specific user.
 */
router.get("/all/user/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, reservations: [] });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        }

        const reservations = await Reservation.findAll({ where: { userId } });
        if (reservations.length === 0) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        }
        res.send({ reservations });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Updates a reservation (Moves seat).
 * Note: screeningId and clientId cannot be changed per requirements.
 */
router.put("/update/:reservationId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reservationId: number = parseInt(req.params.reservationId.toString());
        if (isNaN(reservationId) || reservationId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_ID, reservations: [] });
        }

        const reservation: ReservationInstance | null = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        }

        let { type, seatId }: Partial<ReservationAttributes> = req.body;

        if (type == null && seatId == null) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        }

        const updateData: Partial<ReservationAttributes> = {};

        if (type !== undefined) {
            if (typeof type !== 'string') return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
            if (!(Constants.RESERVATION_TYPES).includes(type as any)) {
                return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
            }
            updateData.type = type;
        }

        if (seatId !== undefined) {
            if (typeof seatId !== 'number' || !Number.isInteger(seatId)) return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
            if (seatId < Constants.TYPICAL_MIN_ID) {
                return res.status(400).json({ message: Messages.SEAT_ERR_ID, reservations: [] }); 
            }

            const seat: SeatInstance | null = await Seat.findByPk(seatId);
            if (!seat) {
                return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
            }

            const seatReservation: ReservationInstance | null = await Reservation.findOne({where: { seatId, screeningId: reservation.screeningId }});
            if (seatReservation) {
                if (seatReservation.type === Constants.RESERVATION_TYPES[0]) {
                    return res.status(400).json({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });
                }
                else {
                    return res.status(400).json({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
                }
            }
            updateData.seatId = seatId;
        }        

        await reservation.update(updateData);
        res.send({ reservations: [reservation] });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Deletes a reservation.
 */
router.delete("/delete/:reservationId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reservationId: number = parseInt(req.params.reservationId.toString());
        if (isNaN(reservationId) || reservationId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_ID });
        }

        const deletedRows = await Reservation.destroy({ where: { id: reservationId } });
        if (deletedRows === 0) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        }
        res.send({ message: Messages.RESERVATION_MSG_DEL });
    } catch (error: any) {
        next(error);
    }
});

export default router;