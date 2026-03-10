import express, { Request, Response } from "express";
import { Model } from 'sequelize';
import * as Constants from "../constants.ts"
import { Cinema, CinemaInstance } from "../models.js";

const router = express.Router();

// Adds a new cinema to the database
// Requires: name, address, latitude and longitude
router.post("/new", async (req: Request, res: Response) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || !latitude || !longitude) {
    return res
      .status(400)
      .json({ message: "Name, address and both coordinates are all required" });
  }
  if (name.length < Constants.CINEMA_NAME_MIN_LENGTH || name.length > Constants.CINEMA_NAME_MAX_LENGTH) {
    return res.status(400).json({ error: `Cinema name length is incorrect (it should be between ${Constants.CINEMA_NAME_MIN_LENGTH} and ${Constants.CINEMA_NAME_MAX_LENGTH})` });
  }
  if (!address.match(Constants.CINEMA_POLISH_ADDRESS_REGEX)) {
    return res.status(400).json({ error: `Cinema address does not match the specified format (look into the documentation)` });
  }
  if (latitude && (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE)) {
    return res.status(400).json({ error: `Cinema latitude must be between -90 and 90 (degrees)` });
  }
  if (longitude && (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE)) {
    return res.status(400).json({ error: `Cinema longitude must be between -180 and 180 (degrees)` });
  }
  const cinema = await Cinema.create({ name, address, latitude, longitude });
  res.send(cinema);
});

// Sends data about all cinemas in the database
router.get("/all", async (req: Request, res: Response) => {
  const cinemas: CinemaInstance[] = await Cinema.findAll();
  if (!cinemas || cinemas.length === 0) {
    return res.status(404).json({ error: "No cinemas were found" });
  }
  res.send(cinemas);
});

// Sends data about a cinema with the specified id
router.get("/id/:id", async (req: Request, res: Response) => {
  const id: number = parseInt(req.params.id.toString());
  if (!id) {
    return res.status(400).json({ error: "ID is invalid" });
  }
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  res.send(cinema);
});

// Updates data for a cinema with the specified id
router.put("/update/:id", async (req: Request, res: Response) => {
  const id: number = parseInt(req.params.id.toString());
  if (!id) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const { name, address, latitude, longitude } = req.body;
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  if (name && (name.length < Constants.CINEMA_NAME_MIN_LENGTH || name.length > Constants.CINEMA_NAME_MAX_LENGTH)) {
    return res.status(400).json({ error: `Cinema name length is incorrect (it should be between ${Constants.CINEMA_NAME_MIN_LENGTH} and ${Constants.CINEMA_NAME_MAX_LENGTH})` });
  }
  if (!address.match(Constants.CINEMA_POLISH_ADDRESS_REGEX)) {
    return res.status(400).json({ error: `Cinema address does not match the specified format (look into the documentation)` });
  }
  if (latitude && (latitude < Constants.CINEMA_MIN_LATITUDE || latitude > Constants.CINEMA_MAX_LATITUDE)) {
    return res.status(400).json({ error: `Cinema latitude must be between -90 and 90 (degrees)` });
  }
  if (longitude && (longitude < Constants.CINEMA_MIN_LONGITUDE || longitude > Constants.CINEMA_MAX_LONGITUDE)) {
    return res.status(400).json({ error: `Cinema longitude must be between -180 and 180 (degrees)` });
  }
  await cinema.update({ 
    name: name ? name : cinema.name, 
    address: address ? address : cinema.address, 
    latitude: latitude ? latitude : cinema.latitude, 
    longitude: longitude ? longitude : cinema.longitude });
  res.send(cinema);
});

router.delete("/delete/:id", async (req: Request, res: Response) => {
  const id: number = parseInt(req.params.id.toString());
  if (!id) {
    return res.status(400).json({ error: "ID is invalid" });
  }
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  await cinema.destroy();
  res.status(204).send({ message: "Cinema deleted successfully" });
});

export default router;
