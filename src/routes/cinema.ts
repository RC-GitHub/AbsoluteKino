import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts"
import * as Messages from "../messages.ts"
import { Cinema, CinemaAttributes , CinemaInstance } from "../models.js";

const router = express.Router();

// Adds a new cinema to the database
// Requires: name, address, latitude and longitude
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, latitude, longitude } : CinemaAttributes = req.body;
    if (name == null || address == null || latitude == null || longitude == null) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_EMPTY_ARGS });
    }
    if (typeof name !== 'string' || typeof address !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING });
    }
    if (name.length < Constants.CINEMA_NAME_MIN_LENGTH || name.length > Constants.CINEMA_NAME_MAX_LENGTH) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_NAME_LEN });
    }
    if (!Constants.CINEMA_POLISH_ADDRESS_REGEX.test(address)) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ADDRESS });
    }
    if (latitude && (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE)) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_LATITUDE_VAL });
    }
    if (longitude && (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE)) {
      return res.status(400).json({ message:  Messages.CINEMA_ERR_LONGITUDE_VAL });
    }
    const cinema = await Cinema.create({ name, address, latitude, longitude });
    res.send(cinema);
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
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND_ALL });
    }
    res.send(cinemas);
  }
  catch (error: any) {
    next(error);
  }
});

// Sends data about a cinema with the specified ID
router.get("/id/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }
    res.send(cinema);
  }
  catch (error: any) {
    next(error);
  }
});

// Updates data for a cinema with the specified ID
router.put("/update/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const cinema : CinemaInstance | null = await Cinema.findByPk(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }

    const { name, address, latitude, longitude } = req.body;
    const updateData: Partial<CinemaAttributes> = {};
    if (name !== undefined) {
      if (typeof name !== 'string') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING });
      if (name.length < Constants.CINEMA_NAME_MIN_LENGTH || name.length > Constants.CINEMA_NAME_MAX_LENGTH) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_NAME_LEN });
      }
      updateData.name = name;
    }
    if (address !== undefined) {
      if (typeof address !== 'string') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING });
      if (!Constants.CINEMA_POLISH_ADDRESS_REGEX.test(address)) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_ADDRESS });
      }
      updateData.address = address;
    }
    if (latitude !== undefined) {
      if (typeof latitude !== 'number') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING });
      if (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_LATITUDE_VAL });
      }
      updateData.latitude = latitude;
    }
    if (longitude !== undefined) {
      if (typeof longitude !== 'number') return res.status(400).json({ message: Messages.CINEMA_ERR_TYPING });
      if (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE) {
        return res.status(400).json({ message: Messages.CINEMA_ERR_LONGITUDE_VAL });
      }
      updateData.latitude = latitude;
    }
    await cinema.update(updateData);
    res.send(cinema);
  }
  catch (error: any) {
    next(error);
  }
});

// Deletes a cinema with the specified ID
router.delete("/delete/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cinemaId: number = parseInt(req.params.cinemaId.toString());
    if (!cinemaId) {
      return res.status(400).json({ message: Messages.CINEMA_ERR_ID });
    }
    const deletedRows: number = await Cinema.destroy({
      where: { id: cinemaId }
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND });
    }
    res.status(200).json({ message: Messages.CINEMA_MSG_DEL });
  }
  catch (error: any) {
    next(error);
  }
});

export default router;
