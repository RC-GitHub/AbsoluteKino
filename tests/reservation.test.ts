// import sequelize from "../src/models";
// import * as Constants from "../src/constants";
// import * as Messages from "../src/messages";
// import * as Utils from "./utils";

// beforeAll(async () => {
//     await sequelize.sync({ force: true });
// });

// describe("Reservation Lifecycle Flow", async () => {
//     let response;

//     //---------------------------------
//     // NOTES
//     //---------------------------------
//     // Once a reservation is created, its reservation date, screening id and user id cannot be changed
//     // TODO: Reservation API should handle a case where multiple seats are selected
//     //---------------------------------
//     // Step 1 - POST
//     //---------------------------------
//     // Cinema, Room, Movie, Screening, and User objects are created first.
//     // Then a reservation is connected to the screening and user.
//     // Tests cover all typing, range, and unique seat constraint failures.
//     // At the end, only 1 reservation exists in the database.
//     //---------------------------------

//     describe("POST /reservation/new", async () => {
//         it("(MODEL EXAMPLE) should respond with 200 and the created reservation object", async () => {
//             await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
//             await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData);
//             await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData);
//             await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData);
//             await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);

//             response = await Utils.sendRequest("/reservation/new", 200, "POST", Utils.reservationData);
//             expect(response.body).toHaveProperty("reservations");
//             expect(response.body.reservations[0]).toHaveProperty("id", 1);
//             expect(response.body.reservations[0]).toHaveProperty("row", Utils.reservationData.row);
//             expect(response.body.reservations[0]).toHaveProperty("column", Utils.reservationData.column);
//         });

//         it("should respond with 400 if required fields are missing", async () => {
//             // row: undefined or null
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, row: undefined });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, row: null });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

//             // column: undefined or null
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, column: undefined });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, column: null });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });  

//             // Missing screeningId
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: undefined });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: null });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

//             // Missing userId
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: undefined });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: null });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

//             // all are undefined
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", {});
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//         });

//         it("should respond with 400 if required types are incorrect", async () => {
//             // row as string
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, row: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

//             // column as string
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, column: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

//             // screeningId as string
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

//             // userId as string
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
//         });

//         it("should respond with 400 if row value is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, row: Constants.RESERVATION_MIN_ROW_VAL - 1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });

//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, row: Constants.RESERVATION_MAX_ROW_VAL });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });
//         });

//         it("should respond with 400 if column value is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, column: Constants.RESERVATION_MIN_COL_VAL - 1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_COL_VAL, reservations: [] });

//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, column: Constants.RESERVATION_MAX_COL_VAL });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_COL_VAL, reservations: [] });
//         });

//         it("should respond with 400 if the seat is already occupied", async () => {
//             // Attempting to book the same seat as the MODEL EXAMPLE
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", Utils.reservationData);
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_OCCUPIED, reservations: [] });
//         });

//         it("should respond with 400 if screening id is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: 0 });
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: -1 });
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
//         });

//         it("should respond with 400 if user id is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: 0 });
//             expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: -1 });
//             expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
//         });

//         it("should respond with 404 if screening or user does not exist", async () => {
//             // Non-existent screening
//             response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, screeningId: 99 });
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });

//             // Non-existent user
//             response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, userId: 99 });
//             expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
//         });
//     });

//     //---------------------------------
//     // Step 2 - GET
//     //---------------------------------
//     // Multiple reservations are created to test collection fetching.
//     // Fetching by ID, by Screening, and by User are all verified.
//     // At the end, 2 reservations exist in the database.
//     //---------------------------------

//     describe("GET /reservation/all", async () => {
//         it("(MODEL EXAMPLE) should respond with 200 and all reservations", async () => {
//             // Add a second reservation in a different seat
//             await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, column: 11 });
            
//             response = await Utils.sendRequest("/reservation/all", 200, "GET");
//             expect(response.body.reservations).toHaveLength(2);
//         });
//     });

//     describe("GET /reservation/all/screening/:screeningId", async () => {
//         it("should respond with 200 and reservations for specific screening", async () => {
//             response = await Utils.sendRequest("/reservation/all/screening/1", 200, "GET");
//             expect(response.body.reservations).toBeInstanceOf(Array);
//             expect(response.body.reservations.length).toBe(2);
//         });

//         it("should respond with 400 if screeningId is not valid", async () => {
//             response = await Utils.sendRequest("/reservation/all/screening/abc", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/all/screening/0", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/all/screening/-1", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
//         });

//         it("should respond with 404 if specified screening object is not found in the database", async () => {
//             response = await Utils.sendRequest("/reservation/all/screening/2", 404, "GET");
//             expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
//         });

//         it("should respond with 404 if no screening objects are connected to the specified reservation object", async () => {
//             // Create a new screening (ID 2) with no bookings
//             await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData);
//             response = await Utils.sendRequest("/reservation/all/screening/2", 404, "GET");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_SCREENING, reservations: [] });
//         });
//     });

//     describe("GET /reservation/all/user/:userId", async () => {
//         it("should respond with 200 and reservations for specific user", async () => {
//             response = await Utils.sendRequest("/reservation/all/user/1", 200, "GET");
//             expect(response.body.reservations).toBeInstanceOf(Array);
//             expect(response.body.reservations.length).toBe(2);
//         });

//         it("should respond with 400 if userId is not valid", async () => {
//             response = await Utils.sendRequest("/reservation/all/user/abc", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/all/user/0", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

//             response = await Utils.sendRequest("/reservation/all/user/-1", 400, "GET");
//             expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
//         });

//         it("should respond with 404 if specified user object is not found in the database", async () => {
//             response = await Utils.sendRequest("/reservation/all/user/2", 404, "GET");
//             expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
//         });

//         it("should respond with 404 if no user objects are connected to the specified reservation object", async () => {
//             // Create a new user (ID 2) with no bookings
//             await Utils.sendRequest("/user/register", 200, "POST", Utils.userDataUnauthorized);
//             response = await Utils.sendRequest("/reservation/all/user/2", 404, "GET");
//             expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
//         });
//     });

//     //---------------------------------
//     // Step 3 - PUT
//     //---------------------------------
//     // Reservations are moved/updated.
//     // Range and occupation conflicts are tested during update.
//     //---------------------------------

//     describe("PUT /reservation/update/:reservationId", async () => {
//         it("(MODEL EXAMPLE) should respond with 200 and move reservation to new seat", async () => {
//             const updateData = { row: 6, column: 20 };
//             response = await Utils.sendRequest("/reservation/update/1", 200, "PUT", updateData);
//             expect(response.body.reservations[0]).toHaveProperty("row", updateData.row);
//             expect(response.body.reservations[0]).toHaveProperty("column", updateData.column);
//         });

//         it("should respond with 400 if required fields are missing", async () => {
//             // all are null
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { row: null, column: null, reservationDate: null });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

//             // all are undefined
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", {});
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] }); 

//             // mixed invalid
//             const mixedInvalid = { 
//                 row: null, 
//                 column: undefined, 
//                 reservationDate: null 
//             };
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", mixedInvalid);
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
//         });

//         it("should respond with 400 if required types are incorrect", async () => {
//             // row as string
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, row: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

//             // column as string
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, column: "5" });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
//         });

//         it("should respond with 400 if updating to an occupied seat", async () => {
//             // Try to move reservation 1 to the position of reservation 2 (Row 5, Col 11)
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { row: 5, column: 11 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_OCCUPIED, reservations: [] });
//         });

//         it("should respond with 400 if updated row is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { row: -1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });

//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { row: Constants.RESERVATION_MAX_ROW_VAL + 1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });
//         });

//         it("should respond with 400 if updated column is invalid", async () => {
//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { column: -1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });

//             response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { column: Constants.RESERVATION_MAX_COL_VAL + 1 });
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ROW_VAL, reservations: [] });
//         });
//     });

//     //---------------------------------
//     // Step 4 - DELETE
//     //---------------------------------
//     // All reservation objects are being deleted one by one
//     // Then tests go over all cases which result in deletion failure
//     // At the end of the step no reservation objects are in the database
//     //---------------------------------

//     describe("DELETE /reservation/delete/:reservationId", async () => {
//         it("(MODEL EXAMPLE) should respond with 200 and delete reservation", async () => {
//             await Utils.sendRequest("/reservation/delete/1", 200, "DELETE");
//             response = await Utils.sendRequest("/reservation/delete/2", 200, "DELETE");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_MSG_DEL });
//         });

//         it("should respond with 400 if reservationId is not valid", async () => {
//             response = await Utils.sendRequest("/reservation/delete/abc", 400, "DELETE");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });

//             response = await Utils.sendRequest("/reservation/delete/0", 400, "DELETE");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });

//             response = await Utils.sendRequest("/reservation/delete/-1", 400, "DELETE");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });
//         });

//         it("should respond with 404 if deleting non-existent ID", async () => {
//             response = await Utils.sendRequest("/reservation/delete/1", 404, "DELETE");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
//         });
//     });

//     //---------------------------------
//     // Step 5 - GET (404)
//     //---------------------------------
//     // Database is empty, fetching all should 404
//     //---------------------------------

//     describe("GET (404) /reservation/all", async () => {
//         it("should respond with 404 if database is empty", async () => {
//             response = await Utils.sendRequest("/reservation/all", 404, "GET");
//             expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_ALL, reservations: [] });
//         });
//     });
// });