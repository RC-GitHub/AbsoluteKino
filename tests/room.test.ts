import sequelize, { Cinema, Room, Seat, User, UserInstance } from "../src/models";

import * as Constants from "../src/constants"
import * as Messages from "../src/messages"
import * as Utils from "./utils"

let siteAdmin: UserInstance;
let regularUser: UserInstance;
let cinemaAdmin: UserInstance;
let unauthorizedCinemaAdmin: UserInstance;

let siteAdminCookie: string[] | undefined = [];
let regularCookie: string[] | undefined = [];
let cinemaAdminCookie: string [] | undefined = [];
let unauthorizedCinemaAdminCookie: string [] | undefined = [];

let cinemaId: number;

beforeAll(async () => {
    await sequelize.sync({ force: true });  

    const siteAdminData = await Utils.createSiteAdmin();
    const regularUserData = await Utils.createRegularUser();

    siteAdmin = siteAdminData.user;
    regularUser = regularUserData.user;

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
    // Then two rooms connected with that cinema
    // Then tests go over all cases which result in failure
    // Then yet another two rooms connected with that cinema, which also create many seats
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 cinema object and 4 rooms are in the database
    //---------------------------------

    describe("POST /room/new", async () => {
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

            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomData.name);
            expect(response.body.rooms[0]).toHaveProperty("width", Utils.roomData.width);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomData.cinemaId);

            // Creating a room with a non-default size
            const nonDefaultRoomData = { ...Utils.roomData, width: 1250, depth: 1000, rowAmount: 17, colAmount: 22 }
            response = await Utils.sendRequest("/room/new", 200, "POST", nonDefaultRoomData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("width", nonDefaultRoomData.width);
            expect(response.body.rooms[0]).toHaveProperty("depth", nonDefaultRoomData.depth);
            expect(response.body.rooms[0]).toHaveProperty("rowAmount", nonDefaultRoomData.rowAmount);
            expect(response.body.rooms[0]).toHaveProperty("colAmount", nonDefaultRoomData.colAmount);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // name: undefined or null
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // cinemaId: undefined or null (this gets intercepted by authorization functions first)
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            // all are undefined
            response = await Utils.sendRequest("/room/new", 400, "POST", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            // mixed invalid
            const mixedInvalid = { 
                name: null, 
                cinemaId: undefined 
            };
            response = await Utils.sendRequest("/room/new", 400, "POST", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: 20 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, width: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, depth: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // row amount: not an integer
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, rowAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // column amount: not an integer
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, colAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // cinema id: not an integer
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
        });

        it("should respond with 400 if name is too short or too long", async () => {
            await Utils.boundsCheck(
                "/room/new",
                "POST",
                Utils.roomData,
                Constants.ROOM_NAME_MIN_LEN,
                Constants.ROOM_NAME_MAX_LEN,
                Messages.ROOM_ERR_NAME_LEN,
                "name",
                "string",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if width is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new",
                "POST",
                Utils.roomData,
                Constants.ROOM_WIDTH_MIN_VAL,
                Constants.ROOM_WIDTH_MAX_VAL,
                Messages.ROOM_ERR_WIDTH,
                "width",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if depth is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new",
                "POST",
                Utils.roomData,
                Constants.ROOM_DEPTH_MIN_VAL,
                Constants.ROOM_DEPTH_MAX_VAL,
                Messages.ROOM_ERR_DEPTH,
                "depth",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if rowAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new",
                "POST",
                Utils.roomData,
                Constants.ROOM_ROWS_MIN_VAL,
                Constants.ROOM_ROWS_MAX_VAL,
                Messages.ROOM_ERR_ROWS,
                "rowAmount",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if colAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new",
                "POST",
                Utils.roomData,
                Constants.ROOM_COLS_MIN_VAL,
                Constants.ROOM_COLS_MAX_VAL,
                Messages.ROOM_ERR_COLS,
                "colAmount",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/room/new", "POST", {}, "rooms");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/room/new", "POST", {}, "rooms");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/room/new", "POST", {}, "rooms");    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/room/new", "POST", {}, "rooms", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/room/new", "POST", {}, "rooms", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            let unauthorizedCinemaAdminData = await Utils.createRegularUser();
            unauthorizedCinemaAdminData = await Utils.levelUserTo(unauthorizedCinemaAdminData.user, 2, unauthorizedCinemaAdminData.cookie);

            unauthorizedCinemaAdmin = unauthorizedCinemaAdminData.user;
            unauthorizedCinemaAdminCookie = unauthorizedCinemaAdminData.cookie;

            await Utils.unauthorizedCheck("/room/new", "POST", { cinemaId: cinemaId }, "rooms", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/new", 404, "POST", { ...Utils.roomData, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
        });
    });

    let lastSeatId: number;
    describe("POST /room/new/default-seats", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created room object", async () => {
            response = await Utils.sendRequest("/room/new/default-seats", 200, "POST", Utils.roomDataWithStairs, cinemaAdminCookie);
            
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomDataWithStairs.name);
            expect(response.body.rooms[0]).toHaveProperty("width", Utils.roomDataWithStairs.width);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomDataWithStairs.cinemaId);
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats[0]).toHaveProperty("row", 1);
            expect(response.body.seats[0]).toHaveProperty("column", 1);
            expect(response.body.seats[response.body.seats.length-1]).toHaveProperty("row", Utils.roomDataWithStairs.rowAmount);
            expect(response.body.seats[response.body.seats.length-1]).toHaveProperty("column", Utils.roomDataWithStairs.colAmount);

            // Creating a room with a non-default size
            const nonDefaultRoomData = { ...Utils.roomDataWithStairs, width: 1250, depth: 1000, rowAmount: 5, colAmount: 8 }
            response = await Utils.sendRequest("/room/new/default-seats", 200, "POST", nonDefaultRoomData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("width", nonDefaultRoomData.width);
            expect(response.body.rooms[0]).toHaveProperty("depth", nonDefaultRoomData.depth);
            expect(response.body.rooms[0]).toHaveProperty("rowAmount", nonDefaultRoomData.rowAmount);
            expect(response.body.rooms[0]).toHaveProperty("colAmount", nonDefaultRoomData.colAmount);
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats[0]).toHaveProperty("row", 1);
            expect(response.body.seats[0]).toHaveProperty("column", 1);
            expect(response.body.seats[response.body.seats.length-1]).toHaveProperty("row", nonDefaultRoomData.rowAmount);
            expect(response.body.seats[response.body.seats.length-1]).toHaveProperty("column", nonDefaultRoomData.colAmount);

            lastSeatId = response.body.seats[response.body.seats.length-1].id;
        });

        it("should respond with 400 if required fields are missing", async () => {
            // name: undefined or null
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, name: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS_EX, rooms: [], seats: [] });
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, name: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS_EX, rooms: [], seats: [] });

            // cinemaId: undefined or null
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, cinemaId: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, cinemaId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });

            // stairsPlacements: undefined or null
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS_EX, rooms: [], seats: [] });
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS_EX, rooms: [], seats: [] });

            // all are undefined
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });

            // mixed invalid
            const mixedInvalid = { 
                name: null, 
                cinemaId: undefined,
                stairsPlacements: null
            };
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, name: 20 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, width: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, depth: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // row amount: not an integer
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, rowAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // column amount: not an integer
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, colAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // cinema id: not an integer
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, cinemaId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [], seats: [] });

            // stairsPlacements: not an array of Stair objects
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, cinemaId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });

            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, cinemaId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [], seats: [] });
        });

        it("should respond with 400 if name is too short or too long", async () => {
            await Utils.boundsCheck(
                "/room/new/default-seats",
                "POST",
                Utils.roomDataWithStairs,
                Constants.ROOM_NAME_MIN_LEN,
                Constants.ROOM_NAME_MAX_LEN,
                Messages.ROOM_ERR_NAME_LEN,
                "name",
                "string",
                ["rooms", "seats"],
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if width is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new/default-seats",
                "POST",
                Utils.roomDataWithStairs,
                Constants.ROOM_WIDTH_MIN_VAL,
                Constants.ROOM_WIDTH_MAX_VAL,
                Messages.ROOM_ERR_WIDTH,
                "width",
                "number",
                ["rooms", "seats"],
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if depth is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new/default-seats",
                "POST",
                Utils.roomDataWithStairs,
                Constants.ROOM_DEPTH_MIN_VAL,
                Constants.ROOM_DEPTH_MAX_VAL,
                Messages.ROOM_ERR_DEPTH,
                "depth",
                "number",
                ["rooms", "seats"],
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if rowAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new/default-seats",
                "POST",
                Utils.roomDataWithStairs,
                Constants.ROOM_ROWS_MIN_VAL,
                Constants.ROOM_ROWS_MAX_VAL,
                Messages.ROOM_ERR_ROWS,
                "rowAmount",
                "number",
                ["rooms", "seats"],
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if colAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/new/default-seats",
                "POST",
                Utils.roomDataWithStairs,
                Constants.ROOM_COLS_MIN_VAL,
                Constants.ROOM_COLS_MAX_VAL,
                Messages.ROOM_ERR_COLS,
                "colAmount",
                "number",
                ["rooms", "seats"],
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if stairs placements are invalid", async () => {
            // Too small x
            const smallXStairsPlacements = { x: -1, width: Constants.ROOM_STAIRS_DEF_VAL }
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: [smallXStairsPlacements] }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });

            // Too big x
            const bigXStairsPlacements = { x: Utils.roomDataWithStairs.width + 1, width: Constants.ROOM_STAIRS_DEF_VAL }
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: [bigXStairsPlacements] }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });

            // Too small width
            const smallWidthStairsPlacements = { x: Utils.roomDataWithStairs.stairsPlacements[0].x, width: Constants.ROOM_STAIRS_MIN_VAL-1 }
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: [smallWidthStairsPlacements] }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });

            // Too big width
            const bigWidthStairsPlacements = { x: Utils.roomDataWithStairs.stairsPlacements[0].x, width: Constants.ROOM_STAIRS_MAX_VAL+1 }
            response = await Utils.sendRequest("/room/new/default-seats", 400, "POST", { ...Utils.roomDataWithStairs, stairsPlacements: [bigWidthStairsPlacements] }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_STAIRS, rooms: [], seats: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/room/new/default-seats", "POST", {}, ["rooms", "seats"]);
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/room/new/default-seats", "POST", {}, ["rooms", "seats"]);
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/room/new/default-seats", "POST", {}, ["rooms", "seats"]);    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/room/new/default-seats", "POST", {}, ["rooms", "seats"], siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/room/new/default-seats", "POST", {}, ["rooms", "seats"], regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            await Utils.unauthorizedCheck("/room/new/default-seats", "POST", { cinemaId: cinemaId }, ["rooms", "seats"], unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/new/default-seats", 404, "POST", { ...Utils.roomDataWithStairs, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [], seats: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 4 rooms get fetched either all at once or individually with varying level of success
    // Then 1 more cinema object is created - no rooms are connected to it, to test fetching rooms in this scenario
    // At the end of the step only 4 room objects and 2 cinema objects are in the database
    //---------------------------------

    describe("GET /room/all/:cinemaId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all room objects", async () => {
            response = await Utils.sendRequest("/room/all/1", 200, "GET");
            expect(response.body).toHaveProperty("rooms");            
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(4);
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            await Utils.invalidIdCheck("/room/all", "GET", {}, Messages.CINEMA_ERR_ID, "rooms")
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/all/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
        });

        it("should respond with 404 if no room objects are connected to the specified cinema object", async () => {
            // Adding a cinema which has no rooms connected to it
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas).toBeInstanceOf(Array);
            expect(response.body.cinemas).toHaveLength(1);
            expect(response.body.cinemas[0]).toHaveProperty("id", 2);

            response = await Utils.sendRequest("/room/all/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND, rooms: [] });
        });
    });

    describe("GET /room/id/:roomId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the specified room object", async () => {
            // Adding a few more rooms
            response = await Utils.sendRequest("/room/id/1", 200, "GET");
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(1);
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomData.name);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            await Utils.invalidIdCheck("/room/id", "GET", {}, Messages.ROOM_ERR_ID, "rooms");
        });

        it("should respond with 404 if the specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/id/5", 404, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, rooms: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // First room object is modified successfully
    // Then tests go over all cases which result in update failure
    // At the end of the step only 4 room objects and 2 cinema objects are in the database
    //---------------------------------

    describe("PUT /room/update/:roomId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const roomDataUpdated =  { ...Utils.roomData, name: "Test Room v2" };
            response = await Utils.sendRequest("/room/update/1", 200, "PUT", roomDataUpdated, cinemaAdminCookie);

            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(1);
            expect(response.body.rooms[0]).toHaveProperty("name", roomDataUpdated.name);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            await Utils.invalidIdCheck("/room/update", "PUT", {}, Messages.ROOM_ERR_ID, "rooms", cinemaAdminCookie);
        });

        it("should respond with 400 if all fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // mixed invalid
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {name: null, cinemaId: undefined}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // all are null
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {name: null, chairPlacement: null, cinemaId: null}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, name: 20 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, width: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, depth: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // row amount: not an integer
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, rowAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // column amount: not an integer
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, colAmount: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // cinema id: not an integer
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, cinemaId: "1" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, cinemaId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, cinemaId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
        });

        it("should respond with 400 if name is too short or too long", async () => {
            await Utils.boundsCheck(
                "/room/update/1",
                "PUT",
                Utils.roomData,
                Constants.ROOM_NAME_MIN_LEN,
                Constants.ROOM_NAME_MAX_LEN,
                Messages.ROOM_ERR_NAME_LEN,
                "name",
                "string",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if width is invalid", async () => {
			await Utils.boundsCheck(
                "/room/update/1",
                "PUT",
                Utils.roomData,
                Constants.ROOM_WIDTH_MIN_VAL,
                Constants.ROOM_WIDTH_MAX_VAL,
                Messages.ROOM_ERR_WIDTH,
                "width",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if depth is invalid", async () => {
            await Utils.boundsCheck(
                "/room/update/1",
                "PUT",
                Utils.roomData,
                Constants.ROOM_DEPTH_MIN_VAL,
                Constants.ROOM_DEPTH_MAX_VAL,
                Messages.ROOM_ERR_DEPTH,
                "depth",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if rowAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/update/1",
                "PUT",
                Utils.roomData,
                Constants.ROOM_ROWS_MIN_VAL,
                Constants.ROOM_ROWS_MAX_VAL,
                Messages.ROOM_ERR_ROWS,
                "rowAmount",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if colAmount is invalid", async () => {
            await Utils.boundsCheck(
                "/room/update/1",
                "PUT",
                Utils.roomData,
                Constants.ROOM_COLS_MIN_VAL,
                Constants.ROOM_COLS_MAX_VAL,
                Messages.ROOM_ERR_COLS,
                "colAmount",
                "number",
                "rooms",
                cinemaAdminCookie
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/room/update/1", "PUT", {}, "rooms");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/room/update/1", "PUT", {}, "rooms");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/room/update/1", "PUT", {}, "rooms");    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/room/update/1", "PUT", {}, "rooms", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/room/update/1", "PUT", {}, "rooms", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            await Utils.unauthorizedCheck("/room/update/1", "PUT", { cinemaId: cinemaId }, "rooms", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/update/99", 404, "PUT", Utils.roomData, cinemaAdminCookie); 
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, rooms: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/update/1", 404, "PUT", { ...Utils.roomData, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All rooms get deleted followed by all cinema objects
    // Then tests go over all cases which result in deletion failure
    // At the end of the step no room objects and no cinema objects are in the database
    //---------------------------------

    describe("DELETE /room/delete/:roomId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if room object is successfully deleted", async () => {
            await Utils.sendRequest("/room/delete/1", 200, "DELETE");
            await Utils.sendRequest("/room/delete/2", 200, "DELETE");
            await Utils.sendRequest("/room/delete/3", 200, "DELETE");
            response = await Utils.sendRequest("/room/delete/4", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.ROOM_MSG_DEL});
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/room/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID });

            response = await Utils.sendRequest("/room/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID });

            response = await Utils.sendRequest("/room/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/delete/5", 404, "DELETE"); 
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL });
        });
    });
});