import sequelize, { UserInstance } from "../src/models";
import * as Constants from "../src/constants"
import * as Messages from "../src/messages"
import * as Utils from "./utils"
import { deleteSiteAdmin } from "../src/owner";

let siteAdmin: UserInstance;
let regularUser: UserInstance;
let siteAdminCookie: string[] | undefined = []
let regularCookie: string[] | undefined = []

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
    await deleteSiteAdmin(siteAdmin.id!);
    await Utils.deleteUser(regularUser);
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
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas[0].id).toEqual(1);

            // Creating a new room
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomData.name);
            expect(response.body.rooms[0]).toHaveProperty("width", Utils.roomData.width);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomData.cinemaId);

            // Creating a seat
            response = await Utils.sendRequest("/seat/new", 200, "POST", Utils.seatData);
            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats[0]).toHaveProperty("x", Utils.seatData.x);
            expect(response.body.seats[0]).toHaveProperty("row", Utils.seatData.row);
            expect(response.body.seats[0]).toHaveProperty("type", Utils.seatData.type);

        });

        it("should respond with 400 if required fields are missing", async () => {
            // x: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // y: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // row: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // column: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // type: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // roomId: undefined or null
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: undefined });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: null });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // all are undefined
            response = await Utils.sendRequest("/seat/new", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // mixed invalid
            const mixedInvalid = { 
                x: null,
                y: undefined,
                row: null,
                column: undefined,
                type: null,
                roomId: undefined
            };
            response = await Utils.sendRequest("/seat/new", 400, "POST", mixedInvalid);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // x: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // y: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, width: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, depth: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // row: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // columnumn: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // type: not a string
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: 1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // room id: not an integer
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: 0 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, roomId: -1 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/new", 404, "POST", { ...Utils.seatData, roomId: 2 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
        });

        it("should respond with 400 if x is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: Constants.SEAT_X_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, x: Constants.ROOM_WIDTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });
        });

        it("should respond with 400 if y is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: Constants.SEAT_Y_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, y: Constants.ROOM_DEPTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });
        });

        it("should respond with 400 if width is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, width: Constants.SEAT_WIDTH_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, width: Constants.SEAT_WIDTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });
        });

        it("should respond with 400 if depth is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, depth: Constants.SEAT_DEPTH_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, depth: Constants.SEAT_DEPTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });
        });

        it("should respond with 400 if row value is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: Constants.SEAT_ROW_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, row: Constants.ROOM_ROWS_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });
        });

        it("should respond with 400 if column value is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: Constants.SEAT_COL_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, column: Constants.ROOM_COLS_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });
        });

        it("should respond with 400 if type is not in Enum", async () => {
            response = await Utils.sendRequest("/seat/new", 400, "POST", { ...Utils.seatData, type: "Invalid_type" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPE, seats: [] });
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
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            await Utils.sendRequest("/seat/new", 200, "POST", { ...Utils.seatData, roomId: 2 });

            response = await Utils.sendRequest("/seat/all/1", 200, "GET");
            expect(response.body).toHaveProperty("seats");            
            expect(response.body.seats).toBeInstanceOf(Array);
            expect(response.body.seats).toHaveLength(1);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/seat/all/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/all/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/all/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, seats: [] });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/all/3", 404, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND_GLOBAL, seats: [] });
        });

        it("should respond with 404 if no seat objects are connected to the specified room object", async () => {
            // Adding a room which has no seats connected to it
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
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
            response = await Utils.sendRequest("/seat/id/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/id/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/id/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });
        });

        it("should respond with 404 if the specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/id/5", 404, "GET");
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
            const seatDataUpdated =  { ...Utils.seatData, type: Constants.SEAT_TYPES[2], row: 5, column: 10 };
            response = await Utils.sendRequest("/seat/update/1", 200, "PUT", seatDataUpdated);

            expect(response.body).toHaveProperty("seats");
            expect(response.body.seats).toBeInstanceOf(Array);
            expect(response.body.seats).toHaveLength(1);
            expect(response.body.seats[0]).toHaveProperty("type", seatDataUpdated.type);
        });

        it("should respond with 400 if seatId is not valid", async () => {
            response = await Utils.sendRequest("/seat/update/abc", 400, "PUT", Utils.seatData);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/update/0", 400, "PUT", Utils.seatData);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });

            response = await Utils.sendRequest("/seat/update/-1", 400, "PUT", Utils.seatData);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, seats: [] });
        });

        it("should respond with 404 if specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/update/5", 404, "PUT", Utils.seatData); 
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, seats: [] });
        });

        it("should respond with 400 if all fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // mixed invalid
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {x: null, roomId: undefined, y: null, row: undefined, column: null, type: undefined, width: undefined, height: undefined});
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });

            // all are null
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {x: null, y: null, row: null, column: null, type: null, roomId: null, width: null, depth: null});
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_EMPTY_ARGS, seats: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // x: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", {  x: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // y: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { y: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // width: not a finite number
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { width: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // depth: not a finite number
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { depth: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // row: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { row: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // columnumn: not an integer
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { column: "1" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });

            // type: not a string
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { type: 1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPING, seats: [] });
        });

        it("should respond with 400 if updated x is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { x: Constants.SEAT_X_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { x: Constants.ROOM_WIDTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_X_INVALID, seats: [] });
        });

        it("should respond with 400 if updated y is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { y: Constants.SEAT_Y_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { y: Constants.ROOM_DEPTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_Y_INVALID, seats: [] });
        });

        it("should respond with 400 if updated width is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { width: Constants.SEAT_WIDTH_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { width: Constants.SEAT_WIDTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_WIDTH_VAL, seats: [] });
        });

        it("should respond with 400 if updated depth is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { depth: Constants.SEAT_DEPTH_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { depth: Constants.SEAT_DEPTH_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_DEPTH_VAL, seats: [] });
        });

        it("should respond with 400 if updated row value is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { row: Constants.ROOM_ROWS_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { row: Constants.ROOM_ROWS_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ROW_INVALID, seats: [] });
        });

        it("should respond with 400 if updated column value is invalid", async () => {
            // Too small
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { column: Constants.ROOM_COLS_MIN_VAL-1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });

            // Too big
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { column: Constants.ROOM_COLS_MAX_VAL+1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_COL_INVALID, seats: [] });
        });

        it("should respond with 400 if updated type is not in Enum", async () => {
            response = await Utils.sendRequest("/seat/update/1", 400, "PUT", { type: "Invalid_type" });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_TYPE, seats: [] });
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
            await Utils.sendRequest("/seat/delete/1", 200, "DELETE");
            response = await Utils.sendRequest("/seat/delete/2", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.SEAT_MSG_DEL});

            await Utils.sendRequest("/room/delete/1", 200, "DELETE");
            await Utils.sendRequest("/room/delete/2", 200, "DELETE");
            await Utils.sendRequest("/room/delete/3", 200, "DELETE");

            await Utils.sendRequest("/cinema/delete/1", 200, "DELETE", {}, siteAdminCookie);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/seat/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID });

            response = await Utils.sendRequest("/seat/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID });

            response = await Utils.sendRequest("/seat/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/seat/delete/5", 404, "DELETE"); 
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND });
        });
    });
});