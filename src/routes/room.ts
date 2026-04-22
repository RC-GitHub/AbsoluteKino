import sequelize, { Cinema, CinemaInstance, Room, RoomAttributes , RoomInstance, Seat } from "../models.js";
import express, { Request, Response, NextFunction } from "express";

import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import * as Auth from "../middleware/auth.ts";

const router = express.Router();

export const createRoomLogic = async (data: any) => {
    let { name, width, depth, rowAmount, colAmount, cinemaId } : RoomAttributes = data;
    if ( name == null || cinemaId == null ) {
      throw { status: 400, message: Messages.ROOM_ERR_EMPTY_ARGS };
    }
    if (
      typeof name !== 'string' || 
      (width != null && (typeof width !== 'number' || !Number.isFinite(width))) || 
      (depth != null && (typeof depth !== 'number' || !Number.isFinite(depth))) || 
      (rowAmount != null && (typeof rowAmount !== 'number' || !Number.isInteger(rowAmount))) || 
      (colAmount != null && (typeof colAmount !== 'number' || !Number.isInteger(colAmount))) || 
      typeof cinemaId !== 'number' || !Number.isInteger(cinemaId)
    ) {
      throw { status: 400, message: Messages.ROOM_ERR_TYPING };
    }

    if (cinemaId < Constants.TYPICAL_MIN_ID) {
      throw { status: 400, message: Messages.CINEMA_ERR_ID };
    }

    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId)
    if (!cinema) {
      throw { status: 404, message: Messages.CINEMA_ERR_NOT_FOUND };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < Constants.ROOM_NAME_MIN_LEN || trimmedName.length > Constants.ROOM_NAME_MAX_LEN) {
      throw { status: 400, message: Messages.ROOM_ERR_NAME_LEN };
    }

    if (width != null && (width < Constants.ROOM_WIDTH_MIN_VAL || width > Constants.ROOM_WIDTH_MAX_VAL)) {
      throw { status: 400, message: Messages.ROOM_ERR_WIDTH };
    }
    if (depth != null  && (depth < Constants.ROOM_DEPTH_MIN_VAL || depth > Constants.ROOM_DEPTH_MAX_VAL)) {
      throw { status: 400, message: Messages.ROOM_ERR_DEPTH };
    }
    if (rowAmount != null  && (rowAmount < Constants.ROOM_ROWS_MIN_VAL || rowAmount > Constants.ROOM_ROWS_MAX_VAL)) {
      throw { status: 400, message: Messages.ROOM_ERR_ROWS };
    }
    if (colAmount != null && (colAmount < Constants.ROOM_COLS_MIN_VAL || colAmount > Constants.ROOM_COLS_MAX_VAL)) {
      throw { status: 400, message: Messages.ROOM_ERR_COLS };
    }

    return Room.build({ 
      name: trimmedName, 
      width: width ?? Constants.ROOM_WIDTH_DEF_VAL,
      depth: depth ?? Constants.ROOM_DEPTH_DEF_VAL,
      rowAmount: rowAmount ?? Constants.ROOM_ROWS_DEF_VAL,
      colAmount: colAmount ?? Constants.ROOM_COLS_DEF_VAL,
      cinemaId 
    });
}

/** 
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Adds a new room to a specified cinema
 * Requires: name and cinema ID
 * Optional: width, depth, row amount and col amount, all of which have defaults in place if they weren't provided
 */
router.post("/new", 
  Auth.authorize("rooms"), 
  Auth.validatePrivileges("rooms", 2), 
  Auth.validateCinemaMembership("rooms", 3),
  async (req: Request, res: Response, next: NextFunction) => 
{
  try {
    const room: RoomInstance = await createRoomLogic(req.body);
    await room.save();
    res.send({ rooms: [room] });
  }
  catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ 
          message: error.message, 
          rooms: [], 
      });
    }
    next(error);
  }
});

/** 
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Adds a new room to a specified cinema alongside some seats
 * Requires: name, cinema ID and stairsPlacements
 * Optional: width, depth, row amount and col amount, all of which have defaults in place if they weren't provided
 */
router.post("/new/default-seats", 
  Auth.authorize(["rooms", "seats"]), 
  Auth.validatePrivileges(["rooms", "seats"], 2), 
  Auth.validateCinemaMembership(["rooms", "seats"], 3),
  async (req: Request, res: Response, next: NextFunction) => 
{
  const t = await sequelize.transaction();
  try {
    const { name, width, depth, rowAmount, colAmount, stairsPlacements, cinemaId } = req.body;
    if ( name == null || cinemaId == null || stairsPlacements == null) {
      await t.rollback();
      throw { status: 400, message: Messages.ROOM_ERR_EMPTY_ARGS_EX };
    }

    let room = await createRoomLogic(req.body);

    if (!Array.isArray(stairsPlacements)) {
      await t.rollback();
      return res.status(400).send({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });
    }

    for (const stairs of stairsPlacements) {
      if (stairs.x < 0 || stairs.x > (width || Constants.ROOM_WIDTH_DEF_VAL)) {
        await t.rollback();
        return res.status(400).send({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });
      }
      if (stairs.width < Constants.ROOM_STAIRS_MIN_VAL || stairs.width > Constants.ROOM_STAIRS_MAX_VAL) {
        await t.rollback();
        return res.status(400).send({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });
      }
    }

    const horizontalPadding = width * Constants.ROOM_PADDING_DEF_VAL;
    const verticalPadding = depth * Constants.ROOM_PADDING_DEF_VAL;

    const totalStairsWidth = stairsPlacements.reduce((sum, s) => sum + s.width, 0);
    const requiredWidth = 
      (colAmount * Constants.SEAT_WIDTH_DEF_VAL) + 
      ((colAmount - 1) * Constants.SEAT_BETWEEN_MARGIN) + 
      (2 * horizontalPadding) + 
      totalStairsWidth;

    const requiredDepth = 
      Constants.ROOM_SCREEN_GAP_DEF_VAL + 
      (rowAmount * Constants.SEAT_DEPTH_DEF_VAL) + 
      ((rowAmount - 1) * Constants.SEAT_LEG_MARGIN) + 
      verticalPadding;

    if (width < requiredWidth || depth < requiredDepth) {
      await t.rollback();
      return res.status(400).json({ 
        message: Messages.ROOM_ERR_EXCEED, 
        rooms: [], 
        seats: [] 
      });
    }

    await room.save({ transaction: t });

    const seatsToCreate: any[] = [];
    const startY = Constants.ROOM_SCREEN_GAP_DEF_VAL + verticalPadding;
    const sortedStairs = [...stairsPlacements].sort((a, b) => a.x - b.x);

    for (let r = 0; r < rowAmount; r++) {
      const currentY = startY + r * (Constants.SEAT_DEPTH_DEF_VAL + Constants.SEAT_LEG_MARGIN);
      let cumulativeStairShift = 0;

      for (let c = 0; c < colAmount; c++) {
        let currentX = horizontalPadding + (c * (Constants.SEAT_WIDTH_DEF_VAL + Constants.SEAT_BETWEEN_MARGIN)) + cumulativeStairShift;

        for (const stair of sortedStairs) {
          const seatRightEdge = currentX + Constants.SEAT_WIDTH_DEF_VAL;
          if (currentX < (stair.x + stair.width) && seatRightEdge > stair.x) {
            const shift = (stair.x + stair.width + Constants.SEAT_BETWEEN_MARGIN) - currentX;
            currentX += shift;
            cumulativeStairShift += shift;
          }
        }

        seatsToCreate.push({
          row: r + 1,
          column: c + 1,
          x: Math.round(currentX),
          y: Math.round(currentY),
          width: Constants.SEAT_WIDTH_DEF_VAL,
          depth: Constants.SEAT_DEPTH_DEF_VAL,
          type: Constants.SEAT_TYPES[0],
          roomId: room.id
        });
      }
    }

    const seats = await Seat.bulkCreate(seatsToCreate, { transaction: t });
    await t.commit();

    return res.send({ rooms: [room], seats: seats });

  } catch (error: any) {
    try {
        await t.rollback();
    } catch (rollbackError) {
      // Ignore
    }
    if (error.status) {
      return res.status(error.status).json({ 
        message: error.message, 
        rooms: [], 
        seats: [] 
      });
    }
    next(error);
  }
});

/** 
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about all rooms in a specified cinema
 */
router.get("/all/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID, rooms: [] });
    }
    if (cinemaId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID, rooms: [] });
    }
    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId)
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
    }

    const rooms: RoomInstance[] = await Room.findAll({where: {cinemaId: cinemaId}});
    if (rooms.length === 0) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND, rooms: [] });
    }
    res.send({rooms: rooms});
  }
  catch (error: any) {
    next(error);
  }
});

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about a room with the specified id
 */
router.get("/id/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (!roomId) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID, rooms: [] });
    }
    if (roomId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID, rooms: [] });
    }
    const room: RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, rooms: [] });
    }
    res.send({rooms: [room]});
  }
  catch (error: any) {
    next(error);
  }
});

/**  
 * Only cinema admin or higher can get to 200 with this endpoint
 * ===============================
 * Updates data for a room with the specified ID
 */
router.put("/update/:roomId", 
  Auth.authorize("rooms"), 
  Auth.validatePrivileges("rooms", 2), 
  Auth.validateRoomAccess("rooms", 3),
  async (req: Request, res: Response, next: NextFunction) => 
{ 
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (!roomId) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID, rooms: [] });
    }
    if (roomId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID, rooms: [] });
    }
    const room : RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND, rooms: [] });
    }

    let { name, width, depth, rowAmount, colAmount, cinemaId } : RoomAttributes = req.body;
    if (name == null || cinemaId == null) {
      return res.status(400).json({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
    }
    const updateData: Partial<RoomAttributes> = {};
    if (name !== undefined) {
      if (typeof name !== 'string') return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      const trimmedName = name.trim();
      if (trimmedName.length < Constants.ROOM_NAME_MIN_LEN || trimmedName.length > Constants.ROOM_NAME_MAX_LEN) {
        return res.status(400).json({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });
      }
      updateData.name = trimmedName;
    }
    if (width !== undefined) {
      if (typeof width !== 'number' || !Number.isFinite(width)) return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      if (width < Constants.ROOM_WIDTH_MIN_VAL || width > Constants.ROOM_WIDTH_MAX_VAL) {
        return res.status(400).json({ message: Messages.ROOM_ERR_WIDTH, rooms: [] });
      }
      updateData.width = width;
    }
    if (depth !== undefined) {
      if (typeof depth !== 'number' || !Number.isFinite(depth)) return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      if (depth < Constants.ROOM_DEPTH_MIN_VAL || depth > Constants.ROOM_DEPTH_MAX_VAL) {
        return res.status(400).json({ message: Messages.ROOM_ERR_DEPTH, rooms: [] });
      }
      updateData.depth = depth;
    }
    if (rowAmount !== undefined || !Number.isInteger(rowAmount)) {
      if (typeof rowAmount !== 'number') return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      if (rowAmount < Constants.ROOM_ROWS_MIN_VAL || rowAmount > Constants.ROOM_ROWS_MAX_VAL) {
        return res.status(400).json({ message: Messages.ROOM_ERR_ROWS, rooms: [] });
      }
      updateData.rowAmount = rowAmount;
    }
    if (colAmount !== undefined || !Number.isInteger(colAmount)) {
      if (typeof colAmount !== 'number') return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      if (colAmount < Constants.ROOM_COLS_MIN_VAL || colAmount > Constants.ROOM_COLS_MAX_VAL) {
        return res.status(400).json({ message: Messages.ROOM_ERR_COLS, rooms: [] });
      }
      updateData.colAmount = colAmount;
    }
    if (cinemaId !== undefined) {
      if (typeof cinemaId !== 'number' || !Number.isInteger(cinemaId)) return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
      if (cinemaId < Constants.TYPICAL_MIN_ID) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_ID, rooms: [] });
      }

      const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId);
      if (!cinema) {
        return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
      }
      updateData.cinemaId = cinemaId;
    }
    await room.update(updateData);
    res.send({rooms: [room]});
  }
  catch (error: any) {
    next(error);
  }
});

// Deletes a room with the specified ID
router.delete("/delete/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (!roomId) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID });
    }
    if (roomId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID });
    }
    const deletedRows: number = await Room.destroy({
      where: { id: roomId }
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL });
    }
    res.send({ message: Messages.ROOM_MSG_DEL });
  }
  catch (error: any) {
    next(error);
  }
});

// TODO: /delete/force

export default router;
