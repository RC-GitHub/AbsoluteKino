import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import { 
    Reservation, ReservationAttributes, ReservationInstance, 
    Screening, ScreeningInstance, 
    User, UserInstance 
} from "../models.js";

const router = express.Router();

/**
 * Adds a new reservation.
 * Handles single seat selection with systematic validation.
 */
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { row, column, screeningId, clientId }: ReservationAttributes = req.body;

        if (row == null || column == null || screeningId == null || clientId == null) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        }

        if (typeof row !== 'number' || typeof column !== 'number' || typeof screeningId !== 'number' || typeof clientId !== 'number') {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        }

        if (!Number.isInteger(row) || !Number.isInteger(column) || !Number.isInteger(screeningId) || !Number.isInteger(clientId)) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        }

        if (screeningId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        }
        if (clientId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, reservations: [] });
        }

        if (row < Constants.RESERVATION_MIN_ROW_VAL || row >= Constants.RESERVATION_MAX_ROW_VAL) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });
        }
        if (column < Constants.RESERVATION_MIN_COL_VAL || column >= Constants.RESERVATION_MAX_COL_VAL) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_COL_VAL, reservations: [] });
        }

        const screening: ScreeningInstance | null = await Screening.findByPk(screeningId);
        if (!screening) {
            return res.status(404).json({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        }

        const user: UserInstance | null = await User.findByPk(clientId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        }

        const existing = await Reservation.findOne({ where: { screeningId, row, column } });
        if (existing) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_OCCUPIED, reservations: [] });
        }

        const reservation = await Reservation.create({ row, column, screeningId, clientId });
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

        const reservations = await Reservation.findAll({ where: { clientId: userId } });
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

        let { row, column }: Partial<ReservationAttributes> = req.body;

        if (row == null && column == null) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        }

        const updateData: Partial<ReservationAttributes> = {};

        if (row !== undefined) {
            if (typeof row !== 'number') return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
            if (row < Constants.RESERVATION_MIN_ROW_VAL || row >= Constants.RESERVATION_MAX_ROW_VAL) {
                return res.status(400).json({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });
            }
            updateData.row = row;
        }

        if (column !== undefined) {
            if (typeof column !== 'number') return res.status(400).json({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
            if (column < Constants.RESERVATION_MIN_COL_VAL || column >= Constants.RESERVATION_MAX_COL_VAL) {
                return res.status(400).json({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] }); 
            }
            updateData.column = column;
        }
        
        const targetRow = updateData.row ?? reservation.row;
        const targetCol = updateData.column ?? reservation.column;
        
        const conflict = await Reservation.findOne({ 
            where: { screeningId: reservation.screeningId, row: targetRow, column: targetCol } 
        });

        if (conflict && conflict.id !== reservation.id) {
            return res.status(400).json({ message: Messages.RESERVATION_ERR_OCCUPIED, reservations: [] });
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