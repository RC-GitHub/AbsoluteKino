import sequelize, { Cinema, Room, Seat, User, UserInstance } from "../src/models";

import * as Constants from "../src/constants"
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
});

describe("Room Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First cinema object is created successfully
    // Then a rooms connected with that cinema
    // Then a seat connected with that room
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 cinema, 1 room and 1 seat objects are in the database
    //---------------------------------

    describe("POST /seat/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created room object", async () => {
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

            // Creating a new room
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            roomId = response.body.rooms[0].id;
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomData.name);
            expect(response.body.rooms[0]).toHaveProperty("width", Utils.roomData.width);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomData.cinemaId);

            // Creating a seat
            response = await Utils.sendRequest("/seat/new", 200, "POST", { ...Utils.seatData, roomId: roomId }, cinemaAdminCookie);
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats[0]).toHaveProperty("x", Utils.seatData.x);
            expect(response.body.seats[0]).toHaveProperty("row", Utils.seatData.row);
            expect(response.body.seats[0]).toHaveProperty("type", Utils.seatData.type);

        });

        it("should respond with 400 if required fields are missing", async () => {
            // x: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // y: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // row: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // column: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // type: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // roomId: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: undefined }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: null }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            // all are undefined
            response = await Utils.sendRequest("/seat/new", 400, "POST", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            // mixed invalid
            const mixedInvalid = {
                x: null,
                y: undefined,
                row: null,
                column: undefined,
                type: null,
                roomId: undefined
            };
            response = await Utils.sendRequest("/seat/new", 400, "POST", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // x: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // y: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, width: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, depth: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // row: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // column: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // type: not a string
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: 1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // room id: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });
        });

        it("should respond with 400 if x is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_X_MIN_VAL,
              Constants.ROOM_WIDTH_MAX_VAL,
              Messages.SEAT_ERR_X_INVALID,
              "x",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if y is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_Y_MIN_VAL,
              Constants.ROOM_DEPTH_MAX_VAL,
              Messages.SEAT_ERR_Y_INVALID,
              "y",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if width is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_WIDTH_MIN_VAL,
              Constants.SEAT_WIDTH_MAX_VAL,
              Messages.SEAT_ERR_WIDTH_VAL,
              "width",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if depth is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_DEPTH_MIN_VAL,
              Constants.SEAT_DEPTH_MAX_VAL,
              Messages.SEAT_ERR_DEPTH_VAL,
              "depth",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if row value is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_ROW_MIN_VAL,
              Constants.ROOM_ROWS_MAX_VAL,
              Messages.SEAT_ERR_ROW_INVALID,
              "row",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

      it("should respond with 400 if column value is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/new",
              "POST",
              Utils.seatData,
              Constants.SEAT_COL_MIN_VAL,
              Constants.ROOM_COLS_MAX_VAL,
              Messages.SEAT_ERR_COL_INVALID,
              "column",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if type is not in Enum", async () => {
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: "Invalid_type" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPE, seats: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/seat/new", "POST", {}, "seats");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/seat/new", "POST", {}, "seats");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/seat/new", "POST", {}, "seats");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/seat/new", "POST", {}, "seats", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/seat/new", "POST", {}, "seats", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            let unauthorizedCinemaAdminData = await Utils.createRegularUser();
            unauthorizedCinemaAdminData = await Utils.levelUserTo(unauthorizedCinemaAdminData.user, 2, unauthorizedCinemaAdminData.cookie);
            unauthorizedCinemaAdminCookie = unauthorizedCinemaAdminData.cookie;

            await Utils.unauthorizedCheck("/seat/new", "POST", { roomId: roomId }, "seats", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/new", 404, "POST", { ...Utils.seatData, roomId: 2 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 2 more rooms and 1 more seat are created
    // One new room has a new seat connected with it, the other does not
    // At the end of the step only 1 cinema, 3 rooms and 2 seats are in the database
    //---------------------------------

    describe("GET /seat/all/:roomId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all seat objects in specified room", async () => {
            // Creating a new room to check the functionality
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, cinemaAdminCookie);
            await Utils.sendRequest("/seat/new", 200, "POST", { ...Utils.seatData, roomId: 2 }, cinemaAdminCookie);

            response = await Utils.sendRequest("/seat/all/1", 200, "GET");
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats).toBeInstanceOf(Array);
            expect(response.body.seats).toHaveLength(1);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/seat/all",
                "GET",
                {},
                Messages.ROOM_ERR_ID,
                "seats",
            );
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/all/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
        });

        it("should respond with 404 if no seat objects are connected to the specified room object", async () => {
            // Adding a room which has no seats connected to it
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(1);
            expect(response.body.rooms[0]).toHaveProperty("id", 3);

            response = await Utils.sendRequest("/seat/all/3", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND_ROOM, seats: [] });
        });
    });

    describe("GET /seat/id/:seatId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the specified seat object", async () => {
            // Adding a few more rooms
            response = await Utils.sendRequest("/seat/id/1", 200, "GET");
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats).toBeInstanceOf(Array);
            expect(response.body.seats).toHaveLength(1);
            expect(response.body.seats[0]).toHaveProperty("id", 1);
            expect(response.body.seats[0]).toHaveProperty("x", Utils.seatData.x);
        });

        it("should respond with 400 if seatId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/seat/id",
                "GET",
                {},
                Messages.SEAT_ERR_ID,
                "seats",
            );
        });

        it("should respond with 404 if the specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/id/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, seats: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // First seat object is modified successfully
    // Then tests go over all cases which result in update failure
    // At the end of the step only 1 cinema, 3 rooms and 2 seats are in the database
    //---------------------------------

    describe("PUT /seat/update/:seatId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const seatDataUpdated =  { ...Utils.seatData, type: Constants.SEAT_TYPES[2], row: 5, column: 10, roomId: undefined };
            response = await Utils.sendRequest("/seat/update/1", 200, "PUT", seatDataUpdated, cinemaAdminCookie);

            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats).toBeInstanceOf(Array);
            expect(response.body.seats).toHaveLength(1);
            expect(response.body.seats[0]).toHaveProperty("type", seatDataUpdated.type);
        });

      it("should respond with 400 if seatId is not valid", async () => {
            await Utils.invalidIdCheck(
              "/seat/update",
              "PUT",
              Utils.seatData,
              Messages.SEAT_ERR_ID,
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if all fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // mixed invalid
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {x: null, roomId: undefined, y: null, row: undefined, column: null, type: undefined, width: undefined, height: undefined}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // all are null
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {x: null, y: null, row: null, column: null, type: null, roomId: null, width: null, depth: null}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // x: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {  x: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // y: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { y: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { width: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { depth: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // row: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { row: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // columnumn: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { column: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // type: not a string
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { type: 1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });
        });

        it("should respond with 400 if updated x is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_X_MIN_VAL,
              Constants.ROOM_WIDTH_MAX_VAL,
              Messages.SEAT_ERR_X_INVALID,
              "x",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated y is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_Y_MIN_VAL,
              Constants.ROOM_DEPTH_MAX_VAL,
              Messages.SEAT_ERR_Y_INVALID,
              "y",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated width is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_WIDTH_MIN_VAL,
              Constants.SEAT_WIDTH_MAX_VAL,
              Messages.SEAT_ERR_WIDTH_VAL,
              "width",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated depth is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_DEPTH_MIN_VAL,
              Constants.SEAT_DEPTH_MAX_VAL,
              Messages.SEAT_ERR_DEPTH_VAL,
              "depth",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated row value is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_ROW_MIN_VAL,
              Constants.ROOM_ROWS_MAX_VAL,
              Messages.SEAT_ERR_ROW_INVALID,
              "row",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

      it("should respond with 400 if updated column value is invalid", async () => {
            await Utils.boundsCheck(
              "/seat/update/1",
              "PUT",
              Utils.seatData,
              Constants.SEAT_COL_MIN_VAL,
              Constants.ROOM_COLS_MAX_VAL,
              Messages.SEAT_ERR_COL_INVALID,
              "column",
              "number",
              "seats",
              cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated type is not in Enum", async () => {
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { type: "Invalid_type" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPE, seats: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/seat/update/1", "PUT", {}, "seats");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/seat/update/1", "PUT", {}, "seats");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/seat/update/1", "PUT", {}, "seats");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/seat/update/1", "PUT", {}, "seats", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /update", async () => {
            await Utils.unauthorizedCheck("/seat/update/1", "PUT", {}, "seats", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /update", async () => {
            await Utils.unauthorizedCheck("/seat/update/1", "PUT", { roomId: roomId }, "seats", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/update/99", 404, "PUT", Utils.seatData, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, seats: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All rooms get deleted followed by all cinema objects
    // Then tests go over all cases which result in deletion failure
    // At the end of the step no room objects and no cinema objects are in the database
    //---------------------------------

    describe("DELETE /seat/delete/:seatId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if seat object is successfully deleted", async () => {
            response = await Utils.sendRequest("/seat/delete/1", 200, "DELETE", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_MSG_DEL});
        });

        it("should respond with 400 if roomId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/seat/delete",
                "DELETE",
                {},
                Messages.SEAT_ERR_ID,
                "seats",
                cinemaAdminCookie
            )
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/seat/delete/1", "DELETE", {}, "seats");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/seat/delete/1", "DELETE", {}, "seats");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /delete", async () => {
            await Utils.deletedAdminCheck("/seat/delete/1", "DELETE", {}, "seats");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/seat/delete/1", "DELETE", {}, "seats", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /delete", async () => {
            await Utils.unauthorizedCheck("/seat/delete/1", "DELETE", {}, "seats", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /delete", async () => {
            await Utils.unauthorizedCheck("/seat/delete/2", "DELETE", {}, "seats", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/delete/99", 404, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND });
        });
    });
});
