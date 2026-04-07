import sequelize from "../src/models";
import * as Messages from "../src/messages"
import * as Utils from "./utils"

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe("Room Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First cinema object is created successfully
    // Then a room connected with that cinema
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 cinema object and 1 room are in the database
    //---------------------------------

    describe("POST /room/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created room object", async () => {
            // Creating a cinema to connect to a new room
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas[0].id).toEqual(1);

            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0]).toHaveProperty("name", Utils.roomData.name);
            expect(response.body.rooms[0]).toHaveProperty("chairPlacement", Utils.roomData.chairPlacement);
            expect(response.body.rooms[0]).toHaveProperty("cinemaId", Utils.roomData.cinemaId);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // name: undefined or null
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: undefined });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: null });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // chairPlacement: undefined or null
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, chairPlacement: undefined });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, chairPlacement: null });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // cinemaId: undefined or null
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: undefined });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: null });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // all are undefined
            response = await Utils.sendRequest("/room/new", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // mixed invalid
            const mixedInvalid = { 
                name: null, 
                chairPlacement: undefined, 
                cinemaId: null 
            };
            response = await Utils.sendRequest("/room/new", 400, "POST", mixedInvalid);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // invalid name
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: 20 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // invalid chair placement
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, chairPlacement: 1 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // invalid cinema id
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: "1" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, cinemaId: 0 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/new", 404, "POST", { ...Utils.roomData, cinemaId: 2 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
        });

        it("should respond with 400 if name is too short or too long", async () => {
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: "" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });

            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, name: "  " });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });

            const invalidRoomDataLongName =  { ...Utils.roomData }
            invalidRoomDataLongName.name = "Example Example Example Example Example Example Example Example Example"
            response = await Utils.sendRequest("/room/new", 400, "POST", invalidRoomDataLongName);   
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });
        });

        it("should respond with 400 if address does not match RegExp", async () => {
            // only letters from A-I are allowed, and there can't be more than one next to the number
            response = await Utils.sendRequest("/room/new", 400, "POST", { ...Utils.roomData, chairPlacement: "AA20, B20." });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_LAYOUT, rooms: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 3 further room objects are created and connected with the one cinema object
    // These rooms get fetched either all at once or individually with varying level of success
    // Then 1 more cinema object is created - no rooms are connected to it, to test fetching rooms in this scenario
    // At the end of the step only 4 room objects and 2 cinema objects are in the database
    //---------------------------------

    describe("GET /room/all/:cinemaId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all room objects", async () => {
            // Adding a few more rooms
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            response = await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms[0].id).toEqual(4);

            response = await Utils.sendRequest("/room/all/1", 200, "GET");
            expect(response.body).toHaveProperty("rooms");            
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(4);
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/all/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/all/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/all/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/all/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, rooms: [] });
        });

        it("should respond with 404 if no room objects are connected to the specified cinema object", async () => {
            // Adding a cinema which has no rooms connected to it
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
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

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/id/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/id/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/id/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });
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
            response = await Utils.sendRequest("/room/update/1", 200, "PUT", roomDataUpdated);

            expect(response.body).toHaveProperty("rooms");
            expect(response.body.rooms).toBeInstanceOf(Array);
            expect(response.body.rooms).toHaveLength(1);
            expect(response.body.rooms[0]).toHaveProperty("name", roomDataUpdated.name);
        });

        it("should respond with 400 if roomId is not valid", async () => {
            response = await Utils.sendRequest("/room/update/abc", 400, "PUT", Utils.roomData);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/update/0", 400, "PUT", Utils.roomData);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });

            response = await Utils.sendRequest("/room/update/-1", 400, "PUT", Utils.roomData);
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_ID, rooms: [] });
        });

        it("should respond with 404 if specified room object is not found in the database", async () => {
            response = await Utils.sendRequest("/room/update/5", 404, "PUT", Utils.roomData); 
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NOT_FOUND, rooms: [] });
        });

        it("should respond with 400 if all fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // mixed invalid
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {name: null, chairPlacement: undefined, cinemaId: null});
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });

            // all are null
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", {name: null, chairPlacement: null, cinemaId: null});
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_EMPTY_ARGS, rooms: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // invalid name
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, name: 20 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // invalid chair placement
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, chairPlacement: 20 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });

            // invalid cinema id
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, cinemaId: "1" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, rooms: [] });
        });

        it("should respond with 400 if name is too short or too long", async () => {
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, name: "" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });

            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, name: "  " });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });
            
            const invalidRoomDataLongName =  { ...Utils.roomData }
            invalidRoomDataLongName.name = "Example Example Example Example Example Example Example Example Example"
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", invalidRoomDataLongName);   
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_NAME_LEN, rooms: [] });
        });

        it("should respond with 400 if chair placement does not match RegExp", async () => {
            // only letters from A-I are allowed, and there can't be more than one next to the number
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, chairPlacement: "AA20, B20." });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_LAYOUT, rooms: [] });
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/room/update/1", 400, "PUT", { ...Utils.roomData, cinemaId: -1 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, rooms: [] });
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