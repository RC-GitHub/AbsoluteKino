import sequelize, { Cinema, Room, Seat, User, UserInstance, Reservation } from "../src/models";

import * as Constants from "../src/constants";
import * as Messages from "../src/messages";
import * as Utils from "./utils";

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
    await User.destroy({ where: {}, cascade: true })
    await Cinema.destroy({ where: {}, cascade: true })
    await Room.destroy({ where: {}, cascade: true })
    await Seat.destroy({ where: {}, cascade: true })
});

describe("Reservation Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // NOTES
    //---------------------------------
    // Once a reservation is created, its reservation date, screening id and user id cannot be changed
    // TODO: Reservation API should handle a case where multiple seats are selected
    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // Cinema, Room, Movie, Screening, and User objects are created first.
    // The first reservation is then created (ID: 1).
    // Tests cover typing, range, and unique seat constraint failures.
    // End state: 1 reservation exists in the database (ID: 1) with status: RESERVED.
    //---------------------------------

    describe("POST /reservation/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created reservation object", async () => {
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            await Utils.sendRequest("/room/new/default-seats", 200, "POST", Utils.roomDataWithStairs, siteAdminCookie);
            await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData, siteAdminCookie);
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, siteAdminCookie);
            // await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);

            response = await Utils.sendRequest("/reservation/new", 200, "POST", Utils.reservationData);
            expect(response.body).toHaveProperty("reservations");
            expect(response.body.reservations[0]).toHaveProperty("id", 1);
            expect(response.body.reservations[0]).toHaveProperty("seatId", Utils.reservationData.seatId);
            expect(response.body.reservations[0]).toHaveProperty("screeningId", Utils.reservationData.screeningId);
            expect(response.body.reservations[0]).toHaveProperty("userId", Utils.reservationData.userId);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // type: undefined or null
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: undefined });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: null });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // Missing seatId
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: undefined });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: null });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // Missing screeningId
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: undefined });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: null });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // Missing userId
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: undefined });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: null });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // all are undefined
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // mixed invalid
            const mixedInvalid = {
                type: null,
                seatId: undefined,
                screeningId: null,
                userId: undefined,
            };
            response = await Utils.sendRequest("/reservation/new", 400, "POST", mixedInvalid);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // type as number
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: 5 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatId as string
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: "5" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // screeningId as string
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: "5" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // userId as string
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: "5" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        });

        it("should respond with 400 if type is not in Enum", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: "Non-standard" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
        });

        it("should respond with 400 if the seat is blocked by another user", async () => {
            // Create another user
            await Utils.sendRequest("/user/register", 200, "POST", { ...Utils.userData, email: "other_mail@gmail.com", phoneNumber: 999888777 });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: 2 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });
        });

        it("should respond with 400 if the seat is already reserved", async () => {
            // Complete the first reservation
            response = await Utils.sendRequest("/reservation/complete/1", 200, "PUT", { userId: Utils.reservationData.userId });
            expect(response.body).toHaveProperty("reservations");
            expect(response.body.reservations[0]).toHaveProperty("type", Constants.RESERVATION_TYPES[1]);

            response = await Utils.sendRequest("/reservation/new", 400, "POST", Utils.reservationData);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        });


        it("should respond with 400 if seat id is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: 0 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: -1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if screening id is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: 0 });
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: -1 });
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if user id is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: 0 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, userId: -1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if screening or user or seat does not exist", async () => {
            // Non-existent seat
            response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, seatId: 999 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });

            // Non-existent screening
            response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, screeningId: 999 });
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });

            // Non-existent user
            response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, userId: 999 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // Testing collection fetching. Additional records are created:
    // - ID: 2 (Same screening, different seat)
    // - ID: 3 (Same seat, different screening)
    // Tests verify filtering by ID, Screening, User, and Seat.
    // End state: 3 reservations exist in the database (IDs: 1, 2, 3).
    //---------------------------------

    describe("GET /reservation/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all reservations", async () => {
            // Add a second reservation in a different seat
            await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 11 });

            response = await Utils.sendRequest("/reservation/all", 200, "GET");
            expect(response.body.reservations).toHaveLength(2);
        });
    });

    describe("GET /reservation/all/screening/:screeningId", async () => {
        it("should respond with 200 and reservations for specific screening", async () => {
            response = await Utils.sendRequest("/reservation/all/screening/1", 200, "GET");
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(2);
        });

        it("should respond with 400 if screeningId is not valid", async () => {
            response = await Utils.sendRequest("/reservation/all/screening/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/screening/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/screening/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if specified screening object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/screening/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        });

        it("should respond with 404 if no screening objects are connected to the specified reservation object", async () => {
            // Create a new screening (ID 2) with no bookings
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData);
            response = await Utils.sendRequest("/reservation/all/screening/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_SCREENING, reservations: [] });
        });
    });

    describe("GET /reservation/all/user/:userId", async () => {
        it("should respond with 200 and reservations for specific user", async () => {
            response = await Utils.sendRequest("/reservation/all/user/1", 200, "GET");
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(2);
        });

        it("should respond with 400 if userId is not valid", async () => {
            response = await Utils.sendRequest("/reservation/all/user/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/user/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/user/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if specified user object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/user/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 404 if no user objects are connected to the specified reservation object", async () => {
            // Create a new user (ID 2) with no bookings
            await Utils.sendRequest("/user/register", 200, "POST", Utils.userDataUnauthorized);
            response = await Utils.sendRequest("/reservation/all/user/3", 404, "GET");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_USER, reservations: [] });
        });
    });

    describe("GET /reservation/all/seat/:seatId", async () => {
        it("should respond with 200 and reservations for specific seat", async () => {
            // Same seat, but different screening
            await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, screeningId: 2 });
            response = await Utils.sendRequest("/reservation/all/seat/1", 200, "GET");
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(2);
        });

        it("should respond with 400 if seatId is not valid", async () => {
            response = await Utils.sendRequest("/reservation/all/seat/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/seat/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/all/seat/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/seat/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 404 if no seat objects are connected to the specified reservation object", async () => {
            // Create a new user (ID 2) with no bookings
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            await Utils.sendRequest("/seat/new", 200, "POST", { ...Utils.seatData, roomId: 2 }, siteAdminCookie);
            response = await Utils.sendRequest("/reservation/all/seat/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_SEAT, reservations: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // Testing updates (seat change and type updates).
    // Record ID: 4 is created on an empty seat to test collisions with IDs 1 and 2.
    // Tests verify 400 errors for occupied/blocked seats and 404 for missing seats.
    // End state: 4 reservations exist in the database (IDs: 1, 2, 3, 4).
    //---------------------------------

    describe("PUT /reservation/update/:reservationId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and move reservation to new seat", async () => {
            const updateData = { type: Constants.RESERVATION_TYPES[0], seatId: 5 };
            response = await Utils.sendRequest("/reservation/update/1", 200, "PUT", updateData);
            expect(response.body.reservations[0]).toHaveProperty("type", updateData.type);
            expect(response.body.reservations[0]).toHaveProperty("seatId", updateData.seatId);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // all are null
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { type: null, seatId: null });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // all are undefined
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // mixed invalid
            const mixedInvalid = {
                type: null,
                seatId: undefined,
            };
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", mixedInvalid);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // type: not as string
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, type: 2 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatId: not as integer
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, seatId: "5" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        });

        it("should respond with 400 if updated type is invalid", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { type: "Not_in_enum" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
        });

        it("should respond with 400 if updated seat ID is invalid", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { seatId: -1 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { seatId: 0 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if specified seat is not in the database", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 404, "PUT", { seatId: 99 });
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 400 if specified seat corresponds to a reservation that's already in the database", async () => {
            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 12 });
            response = await Utils.sendRequest("/reservation/update/4", 400, "PUT", { type: Constants.RESERVATION_TYPES[1], seatId: 5 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });

            await Utils.sendRequest("/reservation/complete/1", 200, "PUT", { userId: 1 })
            response = await Utils.sendRequest("/reservation/update/4", 400, "PUT", { seatId: 5 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        });
    });

    //---------------------------------
    // Step 3.5 - PUT (Complete)
    //---------------------------------
    // Finalizing reservations (changing type to RESERVED).
    // A helper record ID: 5 is created to verify ownership logic:
    // Ensuring a user cannot finalize a reservation they don't own (400 error).
    // End state: 5 reservations exist in the database (IDs: 1, 2, 3, 4, 5).
    //---------------------------------

    describe("PUT /reservation/complete/:reservationId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and set reservation type to confirmed", async () => {
            response = await Utils.sendRequest("/reservation/complete/2", 200, "PUT", { userId: 1 });

            expect(response.body.reservations[0]).toHaveProperty("id", 2);
            expect(response.body.reservations[0]).toHaveProperty("type", Constants.RESERVATION_TYPES[1]);
        });

        it("should respond with 400 if reservationId is not a valid number", async () => {
            response = await Utils.sendRequest("/reservation/complete/abc", 400, "PUT", { userId: 1 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete/0", 400, "PUT", { userId: 1 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete/-1", 400, "PUT", { userId: 1 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if userId is invalid or missing", async () => {
            // Missing userId
            response = await Utils.sendRequest("/reservation/complete/1", 400, "PUT", {});
            // Jeśli Twoja walidacja userId < MinID rzuca USER_ERR_ID:
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // Incorrect type (string instead of number)
            response = await Utils.sendRequest("/reservation/complete/1", 400, "PUT", { userId: "1" });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // Id too small
            response = await Utils.sendRequest("/reservation/complete/1", 400, "PUT", { userId: -1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
            response = await Utils.sendRequest("/reservation/complete/1", 400, "PUT", { userId: 0 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, reservations: [] });
        });

        it("should respond with 404 if reservation does not exist", async () => {
            response = await Utils.sendRequest("/reservation/complete/999", 404, "PUT", { userId: 1 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 400 if reservation is already completed (wrong type)", async () => {
            response = await Utils.sendRequest("/reservation/complete/1", 400, "PUT", { userId: 1 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        });

        it("should respond with 400 if userId does not match the reservation owner", async () => {
            await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 10 });

            response = await Utils.sendRequest("/reservation/complete/3", 400, "PUT", { userId: 2 });
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // Systematic database cleanup. All records from ID: 1 to 5 are deleted.
    // Tests verify ID validation and 404 handling for non-existent or
    // already deleted records.
    // End state: All reservations are deleted
    //---------------------------------

    describe("DELETE /reservation/delete/:reservationId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and delete reservation", async () => {
            response = await Utils.sendRequest("/reservation/delete/1", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.RESERVATION_MSG_DEL });
        });

        it("should respond with 400 if reservationId is not valid", async () => {
            response = await Utils.sendRequest("/reservation/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });

            response = await Utils.sendRequest("/reservation/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });

            response = await Utils.sendRequest("/reservation/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID });
        });

        it("should respond with 404 if deleting non-existent ID", async () => {
            response = await Utils.sendRequest("/reservation/delete/1", 404, "DELETE");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Final state verification. Since the database is empty, fetching all
    // reservations must result in a 404 error.
    //---------------------------------

    describe("GET (404) /reservation/all", async () => {
        it("should respond with 404 if database is empty", async () => {
            await Reservation.destroy({ where: {}, cascade: true })

            response = await Utils.sendRequest("/reservation/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_ALL, reservations: [] });
        });
    });
});
