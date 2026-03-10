import express, { Request, Response, NextFunction } from 'express';
import sequelize from "./models.js";
import cinemaRouter from "./routes/cinema.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to AbsoluteKino!");
});

app.use("/cinema", cinemaRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({
    error: err.message || err || "Internal Server Error",
  });
});

app.listen(port, async () => {
  try {
    await sequelize.sync({force: true});
    console.log("Database synced successfully.");
    app.listen(port, () => {
      console.log(`AbsoluteKino listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to sync database:", err);
  }
});
