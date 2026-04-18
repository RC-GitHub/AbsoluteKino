import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

import { CONFIG } from './config.ts';
import * as Messages from './messages';

import sequelize, { UserInstance } from "./models.ts";
import cinemaRouter from "./routes/cinema.ts";
import roomRouter from "./routes/room.ts";
import movieRouter from "./routes/movie.ts";
import screeningRouter from "./routes/screening.ts";
import userRouter from "./routes/user.ts";
import reservationRouter from "./routes/reservation.ts";
import productRouter from "./routes/product.ts";
import seatRouter from "./routes/seat.ts";

import { registerOwner } from './owner.ts';

const app = express();
const port: number = CONFIG.PORT;

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send({ message: Messages.APP_WELCOME });
});

app.use("/cinema", cinemaRouter);
app.use("/room", roomRouter);
app.use("/seat", seatRouter);
app.use("/movie", movieRouter);
app.use("/screening", screeningRouter);
app.use("/user", userRouter);
app.use("/reservation", reservationRouter);
app.use("/product", productRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  console.error(Messages.DB_ERR_FETCHING, err);
  res.status(500).send({
    error: err.message || err || Messages.DB_ERR_500,
  });
});

const startServer = async () => {
  try {
    await sequelize.sync({force: CONFIG.DB.FORCE_SYNC});
    console.log(Messages.DB_SYNCED);

    const ownerInfo = await registerOwner();
    if (ownerInfo.message !== Messages.USER_OWNER) {
      console.error(Messages.APP_ERR_OWNER_LISTENING);
    }
    else {
      app.listen(port, () => {
        console.log(Messages.APP_LISTENING);
      });
    }
  } catch (err: any) {
    console.error(Messages.DB_ERR_SYNCING, err);
  }
};

startServer();

export default app;