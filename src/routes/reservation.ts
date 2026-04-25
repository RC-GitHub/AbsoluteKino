import express, { Request, Response, NextFunction } from "express";
import {
    Reservation, ReservationAttributes, ReservationInstance,
    Screening, ScreeningInstance,
    Seat, SeatInstance,
    User, UserInstance
} from "../models.js";

import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import * as Auth from "../middleware/auth.ts";

const router = express.Router();

export const createReservationLogic = async (data: any) => {
    let { type, seatId, screeningId, userId }: ReservationAttributes = data;

    if (
        type == null ||
        seatId == null ||
        screeningId == null ||
        userId == null
    ) {
        throw { status: 400, message: Messages.RESERVATION_ERR_EMPTY_ARGS };
    }

    if (
        typeof type !== 'string' ||
        typeof seatId !== 'number' || !Number.isInteger(seatId) ||
        typeof screeningId !== 'number' || !Number.isInteger(screeningId) ||
        typeof userId !== 'number' || !Number.isInteger(userId)
    ) {
        throw { status: 400, message: Messages.RESERVATION_ERR_TYPING };
    }

    if (seatId < Constants.TYPICAL_MIN_ID) {
        throw { status: 400, message: Messages.SEAT_ERR_ID };
    }
    if (screeningId < Constants.TYPICAL_MIN_ID) {
        throw { status: 400, message: Messages.SCREENING_ERR_ID };
    }
    if (userId < Constants.TYPICAL_MIN_ID) {
        throw { status: 400, message: Messages.USER_ERR_ID };
    }

    if (!Constants.RESERVATION_TYPES.includes(type as any)) {
        throw { status: 400, message: Messages.RESERVATION_ERR_TYPE };
    }

    const seat: SeatInstance | null = await Seat.findByPk(seatId);
    if (!seat) {
        throw { status: 404, message: Messages.SEAT_ERR_NOT_FOUND };
    }
    const screening: ScreeningInstance | null = await Screening.findByPk(screeningId);
    if (!screening) {
        throw { status: 404, message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL };
    }
    const user: UserInstance | null = await User.findByPk(userId);
    if (!user) {
        throw { status: 404, message: Messages.USER_ERR_NOT_FOUND };
    }

    const existingReservation = await Reservation.findOne({ where: { screeningId, seatId } });
    if (existingReservation) {
        if (existingReservation.type === Constants.RESERVATION_TYPES[0]) {
            throw { status: 400, message: Messages.RESERVATION_ERR_BLOCKED };
        }
        else {
            throw { status: 400, message: Messages.RESERVATION_ERR_RESERVED };
        }
    }

    return Reservation.build({
        type,
        seatId,
        screeningId,
        userId
    });
}

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Adds a new reservation
 * Requires a reservation row, column, screening id and client id (user id)
 */
router.post("/new",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 0),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reservation = await createReservationLogic(req.body);
        await reservation.save();
        res.send({ reservations: [reservation] });
    } catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                reservations: error.reservations || [],
            });
        }
        next(error);
    }
});

/**
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Sends data about all reservations
 */
router.get("/all",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 3),
    async (req: Request, res: Response, next: NextFunction) =>
{
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
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Sends data about all reservations for a specific screening
 */
router.get("/all/screening/:screeningId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 3),
    async (req: Request, res: Response, next: NextFunction) => {
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
 * Only authenticated user and higher can get to 200 with this endpoint
 * ===============================
 * Sends data about all reservations for a specific user
 */
router.get("/all/user/:userId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 1),
    Auth.validateOwnership("reservations", 3),
    async (req: Request, res: Response, next: NextFunction) => {
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
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND_USER, reservations: [] });
        }
        res.send({ reservations });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Sends data about all reservations for a specific seat
 */
router.get("/all/seat/:seatId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 3),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seatId: number = parseInt(req.params.seatId.toString());
        if (isNaN(seatId) || seatId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.SEAT_ERR_ID, reservations: [] });
        }

        const seat = await Seat.findByPk(seatId);
        if (!seat) {
            return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        }

        const reservations = await Reservation.findAll({ where: { seatId } });
        if (reservations.length === 0) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND_SEAT, reservations: [] });
        }

        res.send({ reservations });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Updates data (moves a seat) for a reservation with the specified ID
 * Note: screeningId and clientId cannot be changed per requirements
 */
router.put("/update/:reservationId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 3),
    async (req: Request, res: Response, next: NextFunction) => {
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
            console.log(`Informacje`, seatReservation, reservation);
            if (seatReservation &&
                seatReservation.id !== reservation.id &&
                seatReservation.screeningId === reservation.screeningId
            ) {
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
 * Only cookie owner who is an authenticated user or higher can get to 200 with this endpoint
 * ===============================
 * Completes a reservation with the specified ID
 */
router.put("/complete/:reservationId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 1),
    Auth.validateOwnership("reservations", 4),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reservationId: number = parseInt(req.params.reservationId.toString());
        if (isNaN(reservationId) || reservationId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_ID, reservations: [] });
        }

        const reservation: ReservationInstance | null = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        }

        if (reservation.type !== Constants.RESERVATION_TYPES[0]) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        }

        if (reservation.userId !== (req as any).user.id) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });
        }

        await reservation.update({ type: Constants.RESERVATION_TYPES[1] });
        res.send({ reservations: [reservation] });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Only cookie owner who is an authenticated user or higher can get to 200 with this endpoint
 * ===============================
 * Deletes a reservation with the specified ID
 */
router.delete("/delete/:reservationId",
    Auth.authorize("reservations"),
    Auth.validatePrivileges("reservations", 1),
    Auth.validateOwnership("reservations", 4),
    async (req: Request, res: Response, next: NextFunction) =>
{
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
