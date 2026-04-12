import express, { Request, Response, NextFunction } from 'express';
import sequelize from "./models.ts";
import cinemaRouter from "./routes/cinema.ts";
import roomRouter from "./routes/room.ts";
import movieRouter from "./routes/movie.ts";
import screeningRouter from "./routes/screening.ts";
import userRouter from "./routes/user.ts";
import reservationRouter from "./routes/reservation.ts";
import productRouter from "./routes/product.ts";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to AbsoluteKino!");
});

app.use("/cinema", cinemaRouter);
app.use("/room", roomRouter);
app.use("/movie", movieRouter);
app.use("/screening", screeningRouter);
app.use("/user", userRouter);
app.use("/reservation", reservationRouter);
app.use("/product", productRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  console.error("Error fetching cinemas:", err);
  res.status(500).send({
    error: err.message || err || "Internal Server Error",
  });
});

const startServer = async () => {
  try {
    await sequelize.sync({force: true});
    console.log("Database synced successfully.");
    app.listen(port, () => {
      console.log(`AbsoluteKino listening on port ${port}`);
    });
  } catch (err: any) {
    console.error("Failed to sync database:", err);
  }
};

startServer();

export default app;