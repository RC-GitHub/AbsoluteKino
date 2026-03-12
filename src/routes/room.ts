import express, { Request, Response } from "express";
import { Model } from 'sequelize';
import * as Constants from "../constants.ts"
import { Room, RoomAttributes , RoomInstance } from "../models.js";

const router = express.Router();

// Adds a new room to a specified cinema
// Requires: name, chair placement and cinema id
router.post("/new", async (req: Request, res: Response) => {
  const { name, chairPlacement, cinemaId } : RoomAttributes = req.body;
  if (!name || !chairPlacement || !cinemaId) {
    return res
      .status(400)
      .json({ message: "Name, chair placement and cinema id are all required" });
  }
  const room = await Room.create({ name, chairPlacement, cinemaId });
  res.send(room);
});

export default router;
