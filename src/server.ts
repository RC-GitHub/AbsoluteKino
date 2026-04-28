import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

import { CONFIG } from './config';
import { initCronJobs } from "../utils/cron";
import * as Messages from './messages';
import * as Constants from './constants';

import sequelize, { User } from "./models";
import cinemaRouter from "./routes/cinema";
import roomRouter from "./routes/room";
import movieRouter from "./routes/movie";
import screeningRouter from "./routes/screening";
import userRouter from "./routes/user";
import reservationRouter from "./routes/reservation";
import productRouter from "./routes/product";
import seatRouter from "./routes/seat";

import { registerSiteAdmin } from './owner';

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
    error: err.message || err || Messages.DB_ERR_INTERNAL,
  });
});

const startServer = async () => {
  try {
    await sequelize.sync({force: CONFIG.DB.FORCE_SYNC});
    console.log(Messages.DB_SYNCED);

    if (CONFIG.NODE_ENV !== 'test') {
      initCronJobs();

      const existingAdmin = await User.findOne({ where: { accountType: Constants.USER_ACC_TYPES[3] } });

      if (!existingAdmin) {
        await registerSiteAdmin({
          name: CONFIG.INITIAL_OWNER.NAME,
          password: CONFIG.INITIAL_OWNER.PASSWORD,
          email: CONFIG.INITIAL_OWNER.EMAIL,
          phoneNumber: CONFIG.INITIAL_OWNER.PHONE_NUMBER,
        });
        console.log("Initial admin created.");
      }
    }
    
    app.listen(port, () => {
      console.log(Messages.APP_LISTENING);
    });
  } 
  catch (error: any) {
    console.error(Messages.DB_ERR_SYNCING, error);
  }
};

startServer();

export default app;