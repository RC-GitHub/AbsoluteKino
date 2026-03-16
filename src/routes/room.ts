import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts"
import * as Messages from "../messages.ts"
import { Cinema, CinemaInstance, CinemaAttributes, Room, RoomAttributes , RoomInstance } from "../models.js";

const router = express.Router();

// Adds a new room to a specified cinema
// Requires: name, chair placement and cinema ID
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, chairPlacement, cinemaId } : RoomAttributes = req.body;
    if (name == null || chairPlacement == null || cinemaId == null) {
      return res.status(400).json({ message: Messages.ROOM_ERR_EMPTY_ARGS });
    }
    if (typeof name !== 'string' || typeof chairPlacement !== 'string' || typeof chairPlacement !== 'string' || !Number.isInteger(cinemaId)) {
      return res.status(400).json({ message: Messages.ROOM_ERR_TYPING });
    }
    if (name.length < Constants.ROOM_NAME_MIN_LENGTH || name.length > Constants.ROOM_NAME_MAX_LENGTH) {
      return res.status(400).json({ message: Messages.ROOM_ERR_NAME_LEN });
    }
    if (!chairPlacement.match(Constants.ROOM_LAYOUT_REGEX)) {
      return res.status(400).json({ message: Messages.ROOM_ERR_LAYOUT });
    }

    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId)
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }

    const room = await Room.create({ name, chairPlacement, cinemaId });
    res.send(room);
  }
  catch (error: any) {
    next(error);
  }
});

// Sends data about all rooms in a specified cinema
router.get("/all/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId)
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }

    const rooms: RoomInstance[] = await Room.findAll({where: {cinemaId: cinemaId}});
    if (rooms.length === 0) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND });
    }
    res.send(rooms);
  }
  catch (error: any) {
    next(error);
  }
});

// Sends data about a room with the specified id
router.get("/id/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (!roomId) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID });
    }
    const room: RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL });
    }
    res.send(room);
  }
  catch (error: any) {
    next(error);
  }
});


// Updates data for a cinema with the specified ID
router.put("/update/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId: number = parseInt(req.params.roomId.toString());
    if (!roomId) {
      return res.status(400).json({ message: Messages.ROOM_ERR_ID });
    }
    const room : RoomInstance | null = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND });
    }

    const { name, chairPlacement, cinemaId } : RoomAttributes = req.body;
    const updateData: Partial<RoomAttributes> = {};
    if (name !== undefined) {
      if (typeof name !== 'string') return res.status(400).json({ message: Messages.ROOM_ERR_TYPING });
      if (name.length < Constants.ROOM_NAME_MIN_LENGTH || name.length > Constants.ROOM_NAME_MAX_LENGTH) {
        return res.status(400).json({ message: Messages.ROOM_ERR_NAME_LEN });
      }
      updateData.name = name;
    }
    if (chairPlacement !== undefined) {
      if (typeof chairPlacement !== 'string') return res.status(400).json({ message: Messages.ROOM_ERR_TYPING });
      if (!Constants.ROOM_LAYOUT_REGEX.test(chairPlacement)) {
        return res.status(400).json({ message: Messages.ROOM_ERR_LAYOUT });
      }
      updateData.chairPlacement = chairPlacement;
    }
    if (cinemaId !== undefined) {
      if (typeof cinemaId !== 'number' || !Number.isInteger(cinemaId)) return res.status(400).json({ message: Messages.ROOM_ERR_TYPING });
      if (cinemaId < Constants.TYPICAL_MIN_ID) {
        return res.status(400).json({ message: Messages.ROOM_ERR_ID });
      }
      updateData.cinemaId = cinemaId;
    }
    await room.update(updateData);
    res.send(room);
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
    const deletedRows: number = await Room.destroy({
      where: { id: roomId }
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL });
    }
    res.status(200).json({ message: Messages.ROOM_MSG_DEL });
  }
  catch (error: any) {
    next(error);
  }
});

export default router;
