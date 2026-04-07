import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts"
import * as Messages from "../messages.ts"
import { Cinema, CinemaAttributes , CinemaInstance, Room } from "../models.js";

const router = express.Router();

// Adds a new cinema to the database
// Requires: name, address, latitude and longitude
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { name, address, latitude, longitude } : CinemaAttributes = req.body;
    if (name == null || address == null || latitude == null || longitude == null) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
    }
    if (typeof name !== 'string' || typeof address !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
    }
    const trimmedName = name.trim();
    if (trimmedName.length < Constants.CINEMA_NAME_MIN_LEN || trimmedName.length > Constants.CINEMA_NAME_MAX_LEN) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
    }
    if (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
    }
    if (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE) {
      return res.status(400).json({ message:  Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
    }
    if (!Constants.CINEMA_POLISH_ADDRESS_REGEX.test(address)) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
    }

    const cinema = await Cinema.create({ name: trimmedName, address, latitude, longitude });
    res.send({cinemas: [cinema]});
  }
  catch (error: any) {
    next(error);
  }
});

// Sends data about all cinemas in the database
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemas: CinemaInstance[] = await Cinema.findAll();
    if (cinemas.length === 0) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND_ALL, cinemas: [] });
    }
    res.send({cinemas: cinemas});
  }
  catch (error: any) {
    next(error);
  }
});

// Sends data about a cinema with the specified ID
router.get("/id/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (isNaN(cinemaId) || cinemaId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
    }
    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
    }
    res.send({cinemas: [cinema]});
  }
  catch (error: any) {
    next(error);
  }
});

// Updates data for a cinema with the specified ID
router.put("/update/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (isNaN(cinemaId) || cinemaId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
    }
    const cinema : CinemaInstance | null = await Cinema.findByPk(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
    }

    let { name, address, latitude, longitude } = req.body;
    if (name == null && address == null && latitude == null && longitude == null) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
    }
    const updateData: Partial<CinemaAttributes> = {};
    if (name !== undefined) {
      if (typeof name !== 'string') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
      const trimmedName = name.trim();
      if (trimmedName.length < Constants.CINEMA_NAME_MIN_LEN || trimmedName.length > Constants.CINEMA_NAME_MAX_LEN) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
      }
      updateData.name = trimmedName;
    }
    if (latitude !== undefined) {
      if (typeof latitude !== 'number') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
      if (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
      }
      updateData.latitude = latitude;
    }
    if (longitude !== undefined) {
      if (typeof longitude !== 'number') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
      if (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
      }
      updateData.latitude = latitude;
    }
    if (address !== undefined) {
      if (typeof address !== 'string') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
      if (!Constants.CINEMA_POLISH_ADDRESS_REGEX.test(address)) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
      }
      updateData.address = address;
    }
    await cinema.update(updateData);
    res.send({cinemas: [cinema]});
  }
  catch (error: any) {
    next(error);
  }
});

// Deletes a cinema with the specified ID
router.delete("/delete/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (isNaN(cinemaId) || cinemaId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const deletedRows: number = await Cinema.destroy({
      where: { id: cinemaId }
    });
    if (deletedRows < 1) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }
    res.status(200).json({ message: Messages.CINEMA_MSG_DEL });
  }
  catch (error: any) {
    next(error);
  }
});

// TODO:
// Deletes a cinema with the specified ID and everything connected with it
/*router.delete("/delete/force/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    if (cinemaId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const deletedCinemaRows: number = await Cinema.destroy({
      where: { id: cinemaId }
    });
    if (deletedCinemaRows < 1) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }

    const deletedRoomRows: number = await Room.destroy({
      where: { cinemaId: cinemaId }
    });
    if (deletedRoomRows < 1) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }
    res.status(200).json({ message: Messages.CINEMA_MSG_DEL });
  }
  catch (error: any) {
    next(error);
  }
});*/

export default router;
