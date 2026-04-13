import { Room, RoomInstance, Seat, SeatAttributes, SeatInstance } from "../models.js";
import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";

const router = express.Router();

// Adds a new seat to a specified room
// Requires: x, y, row, column, type, and roomId
// Optional: width and depth (defaults applied via model if omitted)
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { x, y, width, depth, row, column, type, roomId }: SeatAttributes = req.body;

    if (
        x == null || y == null || 
        row == null || column == null || 
        type == null || roomId == null
    ) {
      return res.status(400).json({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
    }

    if (
      typeof x !== 'number' || !Number.isFinite(x) ||
      typeof y !== 'number' || !Number.isFinite(y) ||
      typeof row !== 'number' || !Number.isInteger(row) ||
      typeof column !== 'number' || !Number.isInteger(column) ||
      typeof type !== 'string' ||
      typeof roomId !== 'number' || !Number.isInteger(roomId) ||
      (width != null && (typeof width !== 'number' || !Number.isFinite(width))) ||
      (depth != null && (typeof depth !== 'number' || !Number.isFinite(depth)))
    ) {
      return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });
    }

    const room: RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
    }

    if (room.width == null || x < 0 || x > room.width) return res.status(400).json({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });
    if (room.depth == null || y < 0 || y > room.depth) return res.status(400).json({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });
    if (room.rowAmount == null || row < 0 || row > room.rowAmount) return res.status(400).json({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });
    if (room.colAmount == null || column < 0 || column > room.colAmount) return res.status(400).json({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });

    if (width != null && (width < Constants.SEAT_WIDTH_MIN_VAL || width > Constants.SEAT_WIDTH_MAX_VAL)) {
      return res.status(400).json({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });
    }
    if (depth != null && (depth < Constants.SEAT_DEPTH_MIN_VAL || depth > Constants.SEAT_DEPTH_MAX_VAL)) {
      return res.status(400).json({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });
    }
    if (!Constants.SEAT_TYPES.includes(type as any)) {
      return res.status(400).json({ message: Messages.SEAT_ERR_TYPE, seats: [] });
    }

    const seat = await Seat.create({ x, y, width, depth, row, column, type, roomId });
    res.send({ seats: [seat] });
  } catch (error: any) {
    next(error);
  }
});

// Sends data about all seats in a specified room
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seats: SeatInstance[] = await Seat.findAll();
    if (seats.length === 0) {
      return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND_ALL, seats: [] });
    }
    res.send({ seats });
  } catch (error: any) {
    next(error);
  }
});

// Sends data about all seats in a specified room
router.get("/all/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (isNaN(roomId) || roomId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID, seats: [] });
    }

    const room: RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
    }

    const seats: SeatInstance[] = await Seat.findAll({ where: { roomId } });
    if (seats.length === 0) {
      return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND_ROOM, seats: [] });
    }
    res.send({ seats });
  } catch (error: any) {
    next(error);
  }
});

// Sends data about a specific seat by ID
router.get("/id/:seatId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seatId: number = parseInt(req.params.seatId.toString());
    if (isNaN(seatId) || seatId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.SEAT_ERR_ID, seats: [] });
    }

    const seat: SeatInstance | null = await Seat.findByPk(seatId);
    if (!seat) {
      return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND, seats: [] });
    }
    res.send({ seats: [seat] });
  } catch (error: any) {
    next(error);
  }
});

// Updates data for a seat with the specified ID
router.put("/update/:seatId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seatId: number = parseInt(req.params.seatId.toString());
    if (isNaN(seatId) || seatId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.SEAT_ERR_ID, seats: [] });
    }

    const seat: SeatInstance | null = await Seat.findByPk(seatId);
    if (!seat) {
      return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND, seats: [] });
    }

    const room = await Room.findByPk(seat.roomId);
    if (!room) return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });

    const { x, y, width, depth, row, column, type }: Partial<SeatAttributes> = req.body;
    const updateData: Partial<SeatAttributes> = {};

    if (x !== undefined) {
        if (typeof x !== 'number' || !Number.isFinite(x)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (room.width == null || x < 0 || x > room.width) return res.status(400).json({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });
        updateData.x = x;
    }
    if (y !== undefined) {
        if (typeof y !== 'number' || !Number.isFinite(y)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (room.depth == null || y < 0 || y > room.depth) return res.status(400).json({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });
        updateData.y = y;
    }
    if (width !== undefined) {
        if (typeof width !== 'number' || !Number.isFinite(width)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (width < Constants.SEAT_WIDTH_MIN_VAL || width > Constants.SEAT_WIDTH_MAX_VAL) return res.status(400).json({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });
        updateData.width = width;
    }
    if (depth !== undefined) {
        if (typeof depth !== 'number' || !Number.isFinite(depth)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (depth < Constants.SEAT_DEPTH_MIN_VAL || depth > Constants.SEAT_DEPTH_MAX_VAL) return res.status(400).json({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });
        updateData.depth = depth;
    }
    if (row !== undefined) {
        if (typeof row !== 'number' || !Number.isInteger(row)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (room.rowAmount == null || row < 0 || row > room.rowAmount) return res.status(400).json({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });
        updateData.row = row;
    }
    if (column !== undefined) {
        if (typeof column !== 'number' || !Number.isInteger(column)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (room.colAmount == null || column < 0 || column > room.colAmount) return res.status(400).json({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });
        updateData.column = column;
    }
    if (type !== undefined) {
        if (typeof type !== 'string') return res.status(400).json({ message: Messages.SEAT_ERR_TYPING, seats: [] });

        if (!Constants.SEAT_TYPES.includes(type as any)) return res.status(400).json({ message: Messages.SEAT_ERR_TYPE, seats: [] });
        updateData.type = type;
    }

    await seat.update(updateData);
    res.send({ seats: [seat] });
  } catch (error: any) {
    next(error);
  }
});

// Deletes a seat with the specified ID
router.delete("/delete/:seatId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seatId: number = parseInt(req.params.seatId.toString());
    if (isNaN(seatId) || seatId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.SEAT_ERR_ID });
    }

    const deletedRows: number = await Seat.destroy({ where: { id: seatId } });
    if (deletedRows === 0) {
      return res.status(404).json({ message: Messages.SEAT_ERR_NOT_FOUND });
    }
    res.send({ message: Messages.SEAT_MSG_DEL });
  } catch (error: any) {
    next(error);
  }
});

export default router;