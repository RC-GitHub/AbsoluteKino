import sequelize, { Cinema, Room, Seat, User, UserInstance, Movie, Screening } from "../src/models";

import * as Messages from "../src/messages"
import * as Utils from "./utils"

let cinemaAdmin: UserInstance;

let siteAdminCookie: string[] | undefined = []
let regularCookie: string[] | undefined = []
let cinemaAdminCookie: string [] | undefined = [];
let unauthorizedCinemaAdminCookie: string [] | undefined = [];

let cinemaId: number;
let roomId: number;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const siteAdminData = await Utils.createSiteAdmin();
    const regularUserData = await Utils.createRegularUser();

    siteAdminCookie = siteAdminData.cookie;
    regularCookie = regularUserData.cookie;
});

afterAll(async () => {
    await User.destroy({ where: {}, cascade: true })
    await Cinema.destroy({ where: {}, cascade: true })
    await Room.destroy({ where: {}, cascade: true })
    await Seat.destroy({ where: {}, cascade: true })
    await Movie.destroy({ where: {}, cascade: true })
});

describe("Screening Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First cinema object is created successfully
    // Then a room connected with that cinema
    // Then a screening connected with that room
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 cinema object, 1 room and 1 screening are in the database
    //---------------------------------

    describe("POST /screening/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created screening object", async () => {
            // Creating a cinema to connect to a new room
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            cinemaId = response.body.cinemas[0].id;
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas[0].id).toEqual(1);

            // Creating a user with privileges connected with that room
            let cinemaAdminData = await Utils.createRegularUser();
            cinemaAdmin = cinemaAdminData.user;
            cinemaAdminCookie = cinemaAdminData.cookie;
            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: cinemaAdmin.id, cinemaId: cinemaId }, siteAdminCookie);

            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            roomId = response.body.rooms[0].id;
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0].id).toEqual(1);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomData.cinemaId);

            response = await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData, siteAdminCookie);
            expect(response.body).toHaveProperty("movies");
            expect(response.body.movies[0].id).toEqual(1);
            expect(response.body.movies[0]).toHaveProperty("title", Utils.movieData.title);

            response = await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings[0]).toHaveProperty("startDate", Utils.screeningData.startDate.toISOString());
            expect(response.body.screenings[0]).toHaveProperty("basePrice", Utils.screeningData.basePrice);
            expect(response.body.screenings[0]).toHaveProperty("movieId", Utils.screeningData.movieId);
            expect(response.body.screenings[0]).toHaveProperty("roomId", Utils.screeningData.roomId);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // startDate: undefined or null
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, startDate: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, startDate: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });

            // roomId: undefined or null
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, roomId: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, roomId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });

            // movieId: undefined or null
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, movieId: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, movieId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });

            // all are undefined
            response = await Utils.sendRequest("/screening/new", 400, "POST", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });

            // mixed invalid
            const mixedInvalid = {
                startDate: null,
                roomId: undefined,
                movieId: null
            };
            response = await Utils.sendRequest("/screening/new", 400, "POST", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // invalid start date
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, startDate: 1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, startDate: {} }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            // invalid base price
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, basePrice: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            // invalid room id
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, roomId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            // invalid movie id
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, movieId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });
        });

        it("should respond with 400 if base price is not valid", async () => {
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, basePrice: "-1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, roomId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });

            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, roomId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });
        });

        it("should respond with 400 if movieId is not valid", async () => {
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, movieId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, screenings: [] });

            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, movieId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, screenings: [] });
        });

        it("should respond with 400 if start date is invalid", async () => {
            response = await Utils.sendRequest("/screening/new", 400, "POST", { ...Utils.screeningData, startDate: "2000-02-30T00:00:00.000Z" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_START_DATE, screenings: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/screening/new", "POST", {}, "screenings");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/screening/new", "POST", {}, "screenings");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/screening/new", "POST", {}, "screenings");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/screening/new", "POST", {}, "screenings", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/screening/new", "POST", {}, "screenings", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            let unauthorizedCinemaAdminData = await Utils.createRegularUser();
            unauthorizedCinemaAdminData = await Utils.levelUserTo(unauthorizedCinemaAdminData.user, 2, unauthorizedCinemaAdminData.cookie);
            unauthorizedCinemaAdminCookie = unauthorizedCinemaAdminData.cookie;

            await Utils.unauthorizedCheck("/screening/new", "POST", { roomId: roomId }, "screenings", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/new", 404, "POST", { ...Utils.screeningData, roomId: 99 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, screenings: [] });
        });

        it("should respond with 404 if specified movie object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/new", 404, "POST", { ...Utils.screeningData, movieId: 99 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND, screenings: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 3 further screening objects are created and connected with the one room object
    // These screenings get fetched
    // Sometimes all of them, sometimes all in the specified room,
    // Sometimes all connected to a movie and sometimes individually
    // They get fetched with varying level of success
    // Then 1 more room object is created - no screenings are connected to it, to test fetching screenings in this scenario
    // Then 1 more movie object is created - no screenings are connected to it, to test fetching screenings in this scenario
    // At the end of the step only 4 screening objects, 1 cinema object, 2 room objects and 2 movie objects are in the database
    //---------------------------------

    describe("GET /screening/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all screening objects", async () => {
            // Adding a few more screenings
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, cinemaAdminCookie);
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, cinemaAdminCookie);
            response = await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings[0].id).toEqual(4);

            response = await Utils.sendRequest("/screening/all", 200, "GET");
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings).toBeInstanceOf(Array);
            expect(response.body.screenings).toHaveLength(4);
        });
    });

    describe("GET /screening/all/room/:roomId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all screening objects in the specified room", async () => {
            response = await Utils.sendRequest("/screening/all/room/1", 200, "GET");
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings).toBeInstanceOf(Array);
            expect(response.body.screenings).toHaveLength(4);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/screening/all/room",
                "GET",
                {},
                Messages.ROOM_ERR_ID,
                "screenings",
            );
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/all/room/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, screenings: [] });
        });

        it("should respond with 404 if no screening objects are connected to the specified room object", async () => {
            // Adding a cinema which has no rooms connected to it
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(1);
            expect(response.body.rooms[0]).toHaveProperty("id", 2);

            response = await Utils.sendRequest("/screening/all/room/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_ROOM, screenings: [] });
        });
    });

    describe("GET /screening/all/movie/:movieId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all screening objects connected with the specified movie", async () => {
            response = await Utils.sendRequest("/screening/all/movie/1", 200, "GET");
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings).toBeInstanceOf(Array);
            expect(response.body.screenings).toHaveLength(4);
        });

        it("should respond with 400 if movieId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/screening/all/movie",
                "GET",
                {},
                Messages.MOVIE_ERR_ID,
                "screenings",
            );
        });

        it("should respond with 404 if specified movie object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/all/movie/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND, screenings: [] });
        });

        it("should respond with 404 if no screening objects are connected to the specified movie object", async () => {
            // Adding a cinema which has no rooms connected to it
            response = await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData, siteAdminCookie);
            expect(response.body).toHaveProperty("movies");
            expect(response.body.movies).toBeInstanceOf(Array);
            expect(response.body.movies).toHaveLength(1);
            expect(response.body.movies[0]).toHaveProperty("id", 2);

            response = await Utils.sendRequest("/screening/all/movie/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_MOVIE, screenings: [] });
        });
    });

    describe("GET /screening/id/:screeningId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the specified room object", async () => {
            response = await Utils.sendRequest("/screening/id/1", 200, "GET");
            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings).toBeInstanceOf(Array);
            expect(response.body.screenings).toHaveLength(1);
            expect(response.body.screenings[0]).toHaveProperty("id", 1);
        });

        it("should respond with 400 if screening is not valid", async () => {
            await Utils.invalidIdCheck(
                "/screening/id",
                "GET",
                {},
                Messages.SCREENING_ERR_ID,
                "screenings",
            );
        });

        it("should respond with 404 if the specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/id/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, screenings: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // First room object is modified successfully
    // Then tests go over all cases which result in update failure
    // At the end of the step only 4 room objects and 2 cinema objects are in the database
    //---------------------------------

    describe("PUT /screening/update/:screeningId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const screeningDataUpdated =  { ...Utils.screeningData, roomId: 2 };
            response = await Utils.sendRequest("/screening/update/1", 200, "PUT", screeningDataUpdated, cinemaAdminCookie);

            expect(response.body).toHaveProperty("screenings");
            expect(response.body.screenings).toBeInstanceOf(Array);
            expect(response.body.screenings).toHaveLength(1);
            expect(response.body.screenings[0]).toHaveProperty("roomId", screeningDataUpdated.roomId);
        });

        it("should respond with 400 if screeningId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/screening/update",
                "PUT",
                {},
                Messages.SCREENING_ERR_ID,
                "screenings",
                siteAdminCookie
            );
        });

        it("should respond with 400 if all fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });

            // some are null, some are undefined
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", {startDate: null, roomId: undefined, movieId: null, basePrice: undefined}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });

            // all are null
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", {startDate: null, roomId: null, movieId: null}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_EMPTY_ARGS, screenings: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, startDate: 1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, basePrice: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, roomId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });

            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, movieId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_TYPING, screenings: [] });
        });

        it("should respond with 400 if updated name is too short or too long", async () => {
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, startDate: "2000-02-30T00:00:00.000Z" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_START_DATE, screenings: [] });
        });

        it("should respond with 400 if updated base price is not valid", async () => {
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, basePrice: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_PRICE, screenings: [] });
        });

        it("should respond with 400 if updated roomId is not valid", async () => {
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, roomId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });

            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, roomId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, screenings: [] });
        });

        it("should respond with 400 if updated movieId is not valid", async () => {
            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, movieId: 0}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, screenings: [] });

            response = await Utils.sendRequest("/screening/update/1", 400, "PUT", { ...Utils.screeningData, movieId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, screenings: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/screening/update/1", "PUT", {}, "screenings");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/screening/update/1", "PUT", {}, "screenings");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update", async () => {
            await Utils.deletedAdminCheck("/screening/update/1", "PUT", {}, "screenings");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/screening/update/1", "PUT", {}, "screenings", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /update", async () => {
            await Utils.unauthorizedCheck("/screening/update/1", "PUT", {}, "screenings", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /update", async () => {
            await Utils.unauthorizedCheck("/screening/update/1", "PUT", { roomId: roomId }, "screenings", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified screening object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/update/99", 404, "PUT", Utils.screeningData, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, screenings: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All screenings get deleted followed by all room and movie objects
    // Then tests go over all cases which result in deletion failure
    // At the end of the step no objects are in the database
    //---------------------------------

    describe("DELETE /screening/delete/:screeningId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if room object is successfully deleted", async () => {
            response = await Utils.sendRequest("/screening/delete/1", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.SCREENING_MSG_DEL});
        });

        it("should respond with 400 if screeningId is not valid", async () => {
            response = await Utils.sendRequest("/screening/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID });

            response = await Utils.sendRequest("/screening/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID });

            response = await Utils.sendRequest("/screening/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/screening/delete/5", 404, "DELETE");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Now that there are no cinema records in the database, fetching it can be tested for 404 Not Found status
    // At the end of the step no cinema objects are in the database
    //---------------------------------

    describe("GET (404) /screening/all", async () => {
        it("should respond with 404 if no screening objects are found in the database", async () => {
            await Screening.destroy({ where: {}, cascade: true })

            response = await Utils.sendRequest("/screening/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_ALL, screenings: [] });
        });
    });
});
