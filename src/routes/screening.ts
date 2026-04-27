import express, { Request, Response, NextFunction } from "express";
import {
    Room, RoomInstance,
    Movie, MovieInstance,
    Screening, ScreeningAttributes, ScreeningInstance,
} from "../models";

import * as Constants from "../constants";
import * as Messages from "../messages";
import * as Auth from "../middleware/auth";

const router = express.Router();

/**
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Adds a new screening and connects it with a room and a movie
 * Requires: startDate, room ID and movie ID
 */
router.post("/new",
    Auth.authorize("screenings"),
    Auth.validatePrivileges("screenings", 2),
    Auth.validateRoomAccess("screenings", 3), async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { startDate, basePrice, roomId, movieId }: ScreeningAttributes =
            req.body;
        if (startDate == null || roomId == null || movieId == null) {
            return res
                .status(400)
                .json({
                    message: Messages.SCREENING_ERR_EMPTY_ARGS,
                    screenings: [],
                });
        }
        if (
            typeof startDate !== "string" ||
            (basePrice != null && typeof basePrice !== "number")
        ) {
            return res
                .status(400)
                .json({
                    message: Messages.SCREENING_ERR_TYPING,
                    screenings: [],
                });
        }

        const parsedDate = new Date(startDate);
        if (
            !(parsedDate instanceof Date) ||
            typeof roomId !== "number" ||
            !Number.isInteger(roomId) ||
            typeof movieId !== "number" ||
            !Number.isInteger(movieId)
        ) {
            return res
                .status(400)
                .json({
                    message: Messages.SCREENING_ERR_TYPING,
                    screenings: [],
                });
        }
        if (
            isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString() === "Invalid Date"
        ) {
            return res
                .status(400)
                .json({
                    message: Messages.SCREENING_ERR_START_DATE,
                    screenings: [],
                });
        }
        if (
            !(startDate as string).includes(
                parsedDate.toISOString().substring(0, 10),
            )
        ) {
            return res
                .status(400)
                .json({
                    message: Messages.SCREENING_ERR_START_DATE,
                    screenings: [],
                });
        }

        if (!roomId || isNaN(roomId) || roomId < Constants.TYPICAL_MIN_ID) {
            return res
                .status(400)
                .json({ message: Messages.ROOM_ERR_ID, screenings: [] });
        }
        if (!movieId || isNaN(movieId) || movieId < Constants.TYPICAL_MIN_ID) {
            return res
                .status(400)
                .json({ message: Messages.MOVIE_ERR_ID, screenings: [] });
        }

        const room: RoomInstance | null = await Room.findByPk(roomId);
        if (!room) {
            return res
                .status(404)
                .json({
                    message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL,
                    screenings: [],
                });
        }

        const movie: MovieInstance | null = await Movie.findByPk(movieId);
        if (!movie) {
            return res
                .status(404)
                .json({
                    message: Messages.MOVIE_ERR_NOT_FOUND,
                    screenings: [],
                });
        }

        if (basePrice <= 0) {
            return res
                .status(404)
                .json({
                    message: Messages.SCREENING_ERR_PRICE,
                    screenings: [],
                });
        }

        let screeningPrice =
            basePrice == null ? Constants.SCREENING_BASE_SEAT_PRICE : basePrice;
        const screening = await Screening.create({
            startDate: parsedDate,
            basePrice: screeningPrice,
            roomId,
            movieId,
        });
        res.send({ screenings: [screening] });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about all cinemas in the database
 */
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const screenings: ScreeningInstance[] = await Screening.findAll();
        if (screenings.length === 0) {
            return res
                .status(404)
                .json({
                    message: Messages.SCREENING_ERR_NOT_FOUND_ALL,
                    screenings: [],
                });
        }
        res.send({ screenings: screenings });
    } catch (error: any) {
        next(error);
    }
});

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about all screenings in a specified room
 */
router.get(
    "/all/room/:roomId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roomId: number = parseInt(req.params.roomId.toString());
            if (!roomId) {
                return res
                    .status(400)
                    .json({ message: Messages.ROOM_ERR_ID, screenings: [] });
            }
            if (roomId < Constants.TYPICAL_MIN_ID) {
                return res
                    .status(400)
                    .json({ message: Messages.ROOM_ERR_ID, screenings: [] });
            }
            const room: RoomInstance | null = await Room.findByPk(roomId);
            if (!room) {
                return res
                    .status(404)
                    .json({
                        message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL,
                        screenings: [],
                    });
            }

            const screenings: ScreeningInstance[] = await Screening.findAll({
                where: { roomId: roomId },
            });
            if (screenings.length === 0) {
                return res
                    .status(404)
                    .json({
                        message: Messages.SCREENING_ERR_NOT_FOUND_ROOM,
                        screenings: [],
                    });
            }
            res.send({ screenings: screenings });
        } catch (error: any) {
            next(error);
        }
    },
);

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about all screenings connected with a specified movie
 */
router.get(
    "/all/movie/:movieId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const movieId: number = parseInt(req.params.movieId.toString());
            if (!movieId) {
                return res
                    .status(400)
                    .json({ message: Messages.MOVIE_ERR_ID, screenings: [] });
            }
            if (movieId < Constants.TYPICAL_MIN_ID) {
                return res
                    .status(400)
                    .json({ message: Messages.MOVIE_ERR_ID, screenings: [] });
            }
            const movie: MovieInstance | null = await Movie.findByPk(movieId);
            if (!movie) {
                return res
                    .status(404)
                    .json({
                        message: Messages.MOVIE_ERR_NOT_FOUND,
                        screenings: [],
                    });
            }

            const screenings: ScreeningInstance[] = await Screening.findAll({
                where: { movieId: movieId },
            });
            if (screenings.length === 0) {
                return res
                    .status(404)
                    .json({
                        message: Messages.SCREENING_ERR_NOT_FOUND_MOVIE,
                        screenings: [],
                    });
            }
            res.send({ screenings: screenings });
        } catch (error: any) {
            next(error);
        }
    },
);

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about a screening with the specified id
 */
router.get(
    "/id/:screeningId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const screeningId: number = parseInt(
                req.params.screeningId.toString(),
            );
            if (!screeningId) {
                return res
                    .status(400)
                    .json({
                        message: Messages.SCREENING_ERR_ID,
                        screenings: [],
                    });
            }
            if (screeningId < Constants.TYPICAL_MIN_ID) {
                return res
                    .status(400)
                    .json({
                        message: Messages.SCREENING_ERR_ID,
                        screenings: [],
                    });
            }
            const screening: RoomInstance | null =
                await Room.findByPk(screeningId);
            if (!screening) {
                return res
                    .status(404)
                    .json({
                        message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL,
                        screenings: [],
                    });
            }
            res.send({ screenings: [screening] });
        } catch (error: any) {
            next(error);
        }
    },
);

/**
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Updates data for a screening with the specified ID
 */
router.put(
    "/update/:screeningId",
    Auth.authorize("screenings"),
    Auth.validatePrivileges("screenings", 2),
    Auth.validateScreeningAccess("screenings", 3),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const screeningId: number = parseInt(
                req.params.screeningId.toString(),
            );
            if (isNaN(screeningId) || screeningId < Constants.TYPICAL_MIN_ID) {
                return res
                    .status(400)
                    .json({
                        message: Messages.SCREENING_ERR_ID,
                        screenings: [],
                    });
            }

            const screening: ScreeningInstance | null =
                await Screening.findByPk(screeningId);
            if (!screening) {
                return res
                    .status(404)
                    .json({
                        message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL,
                        screenings: [],
                    });
            }

            let { startDate, basePrice, roomId, movieId }: ScreeningAttributes =
                req.body;
            if (
                (startDate === undefined || startDate === null) &&
                (basePrice === undefined || basePrice === null) &&
                (roomId === undefined || roomId === null) &&
                (movieId === undefined || movieId === null)
            ) {
                return res
                    .status(400)
                    .json({
                        message: Messages.SCREENING_ERR_EMPTY_ARGS,
                        screenings: [],
                    });
            }

            const updateData: Partial<ScreeningAttributes> = {};
            if (startDate !== undefined) {
                if (typeof startDate !== "string") {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_TYPING,
                            screenings: [],
                        });
                }

                const parsedDate = new Date(startDate);
                if (
                    isNaN(parsedDate.getTime()) ||
                    !(startDate as string).includes(
                        parsedDate.toISOString().substring(0, 10),
                    )
                ) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_START_DATE,
                            screenings: [],
                        });
                }

                updateData.startDate = parsedDate;
            }
            if (basePrice !== undefined) {
                if (typeof basePrice !== "number") {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_TYPING,
                            screenings: [],
                        });
                }

                if (basePrice <= 0) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_PRICE,
                            screenings: [],
                        });
                }

                updateData.basePrice = basePrice;
            }
            if (roomId !== undefined) {
                if (typeof roomId !== "number" || !Number.isInteger(roomId)) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_TYPING,
                            screenings: [],
                        });
                }
                if (roomId < Constants.TYPICAL_MIN_ID) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.ROOM_ERR_ID,
                            screenings: [],
                        });
                }

                const room = await Room.findByPk(roomId);
                if (!room) {
                    return res
                        .status(404)
                        .json({
                            message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL,
                            screenings: [],
                        });
                }
                updateData.roomId = roomId;
            }
            if (movieId !== undefined) {
                if (typeof movieId !== "number" || !Number.isInteger(movieId)) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.SCREENING_ERR_TYPING,
                            screenings: [],
                        });
                }
                if (movieId < Constants.TYPICAL_MIN_ID) {
                    return res
                        .status(400)
                        .json({
                            message: Messages.MOVIE_ERR_ID,
                            screenings: [],
                        });
                }

                const movie = await Movie.findByPk(movieId);
                if (!movie) {
                    return res
                        .status(404)
                        .json({
                            message: Messages.MOVIE_ERR_NOT_FOUND,
                            screenings: [],
                        });
                }
                updateData.movieId = movieId;
            }

            await screening.update(updateData);
            res.send({ screenings: [screening] });
        } catch (error: any) {
            next(error);
        }
    },
);

/**
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Deletes a screening with the specified ID
 */
router.delete(
    "/delete/:screeningId",
    Auth.authorize("screenings"),
    Auth.validatePrivileges("screenings", 2),
    Auth.validateScreeningAccess("screenings", 3),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const screeningId: number = parseInt(
                req.params.screeningId.toString(),
            );
            if (!screeningId) {
                return res
                    .status(400)
                    .json({ message: Messages.SCREENING_ERR_ID });
            }
            if (screeningId < Constants.TYPICAL_MIN_ID) {
                return res
                    .status(400)
                    .json({ message: Messages.SCREENING_ERR_ID });
            }
            const deletedRows: number = await Screening.destroy({
                where: { id: screeningId },
            });
            if (deletedRows === 0) {
                return res
                    .status(404)
                    .json({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL });
            }
            res.send({ message: Messages.SCREENING_MSG_DEL });
        } catch (error: any) {
            next(error);
        }
    },
);

export default router;
