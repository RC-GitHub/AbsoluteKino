import express from "express";
import sequelize from "./models.js";
import cinemaRouter from "./routes/cinema.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to AbsoluteKino!");
});

app.use("/cinema", cinemaRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: err.message || err || "Internal Server Error",
  });
});

app.listen(port, async () => {
  try {
    await sequelize.sync();
    console.log("Database synced successfully.");
    app.listen(port, () => {
      console.log(`AbsoluteKino listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to sync database:", err);
  }
});
