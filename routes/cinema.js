import express from "express";
import { Cinema } from "../models.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || !latitude || !longitude) {
    return res
      .status(400)
      .json({ message: "Name, address and coordinates are required" });
  }
  const cinema = await Cinema.create({ name, address, latitude, longitude });
  res.send(cinema);
});

router.get("/all", async (req, res) => {
  const cinemas = await Cinema.findAll();
  if (!cinemas || cinemas.length === 0) {
    return res.status(404).json({ error: "No cinemas found" });
  }
  res.send(cinemas);
});

router.get("/id/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  res.send(cinema);
});

router.put("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const { name, address, latitude, longitude } = req.body;
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  await cinema.update({ name, address, latitude, longitude });
  res.send(cinema);
});

router.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const cinema = await Cinema.findByPk(id);
  if (!cinema) {
    return res.status(404).json({ error: "Cinema not found" });
  }
  await cinema.destroy();
  res.status(204).send({ message: "Cinema deleted successfully" });
});

export default router;
