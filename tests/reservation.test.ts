import sequelize, { Cinema, Room, Seat, User, UserInstance, Reservation, Screening } from "../src/models";

import * as Constants from "../src/constants";
import * as Messages from "../src/messages";
import * as Utils from "./utils";
import { win32 } from "path/posix";

let siteAdmin: UserInstance;
let regularUser: UserInstance;
let unauthenticatedUser: UserInstance;
let authenticatedUser: UserInstance;

let siteAdminCookie: string[] | undefined = []
let regularCookie: string[] | undefined = []
let unauthenticatedCookie: string[] | undefined = [];
let authenticatedCookie: string[] | undefined = [];

let bulkData: any;

//---------------------------------
// Step 0 - Users
//---------------------------------
// Site admin and regular user are created before all tests
// Their cookies are stored for use in subsequent tests
//---------------------------------

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const siteAdminData = await Utils.createSiteAdmin();
    const regularUserData = await Utils.createRegularUser();
    const unauthenticatedUserData = await Utils.createRegularUser(Utils.userDataUnauthenticated);

    siteAdmin = siteAdminData.user;
    regularUser = regularUserData.user;
    unauthenticatedUser = unauthenticatedUserData.user;

    siteAdminCookie = siteAdminData.cookie;
    regularCookie = regularUserData.cookie;
    unauthenticatedCookie = unauthenticatedUserData.cookie;

    bulkData = {
        type: Constants.RESERVATION_TYPES[0],
        seatIds: [2, 3, 4],
        screeningId: 1,
    };
});

afterAll(async () => {
    await User.destroy({ where: {}, cascade: true })
    await Cinema.destroy({ where: {}, cascade: true })
    await Room.destroy({ where: {}, cascade: true })
    await Seat.destroy({ where: {}, cascade: true })
    await Screening.destroy({ where: {}, cascade: true })
});

describe("Reservation Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // NOTES
    //---------------------------------
    // Once a reservation is created, its reservation date, screening id and user id cannot be changed
    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // Cinema, Room, Movie, Screening, and User objects are created first
    // The first reservation is then created (ID: 1)
    // Tests cover typing, range, and unique seat constraint failures.
    // End state: 1 reservation exists in the database (ID: 1) with status: RESERVED
    //---------------------------------

    describe("POST /reservation/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created reservation object", async () => {
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            await Utils.sendRequest("/room/new/default-seats", 200, "POST", Utils.roomDataWithStairs, siteAdminCookie);
            await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData, siteAdminCookie);
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, siteAdminCookie);
            // await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);

            response = await Utils.sendRequest("/reservation/new", 200, "POST", Utils.reservationData, unauthenticatedCookie);
            expect(response.body).toHaveProperty("reservations");
            expect(response.body.reservations[0]).toHaveProperty("id", 1);
            expect(response.body.reservations[0]).toHaveProperty("seatId", Utils.reservationData.seatId);
            expect(response.body.reservations[0]).toHaveProperty("screeningId", Utils.reservationData.screeningId);
            expect(response.body.reservations[0]).toHaveProperty("userId", unauthenticatedUser.id);
        });

        it("should respond with 400 if required fields are missing", async () => {
            const fields = ["type", "seatId", "screeningId"];
            for (const field of fields) {
                // Check undefined
                response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, [field]: undefined }, unauthenticatedCookie);
                expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

                // Check null
                response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, [field]: null }, unauthenticatedCookie);
                expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            }
            // all are undefined
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {}, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // all are null
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {
                type: null,
                seatId: null,
                screeningId: null,
            }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // mixed invalid
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {
                type: null,
                seatId: undefined,
                screeningId: null,
            }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // type as number
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: 5 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatId as string
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: "5" }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // screeningId as string
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: "5" }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        });

        it("should respond with 400 if type is not in Enum", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, type: "Non-standard" }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
        });

        it("should respond with 400 if the moment of reservation is farther in the future than screening start date", async () => {
            response = await Utils.sendRequest("/screening/new", 200, "POST", { ...Utils.screeningData, startDate: Utils.createOffsetDate(-1) }, siteAdminCookie);
            const screeningId = response.body.screenings[0].id;

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_DATE_EXPIRED, reservations: [] });
        });

        it("should respond with 400 if the seat is blocked by another user", async () => {
            // Register other user
            response = await Utils.sendRequest("/user/register", 200, "POST", {
                ...Utils.userData,
                email: "other_mail@gmail.com",
                phoneNumber: 999888777
            });

            const otherUserCookie = response.get("Set-Cookie");

            response = await Utils.sendRequest("/reservation/new", 400, "POST", Utils.reservationData, otherUserCookie);
            expect(response.body).toEqual({
                message: Messages.RESERVATION_ERR_BLOCKED,
                reservations: []
            });
        });

        it("should respond with 400 if the seat is already reserved", async () => {
            // Unauthenticated user must first be elevated before he can complete a reservation
            const newUserCredentials = { email: Utils.generateUniqueEmail(), password: "abc".repeat(4) };
            response = await Utils.sendRequest(`/user/update/${unauthenticatedUser.id}`, 200, "PUT", newUserCredentials, unauthenticatedCookie);

            await Utils.sendRequest(`/user/update-type/${unauthenticatedUser.id}`, 200, "PUT", { accountType: Constants.USER_ACC_TYPES[1] }, unauthenticatedCookie);

            response = await Utils.sendRequest(`/user/login`, 200, "POST", { email: newUserCredentials.email, password: newUserCredentials.password });
            authenticatedUser = response.body.users[0];
            authenticatedCookie = response.get("Set-Cookie");

            // Complete the first reservation
            response = await Utils.sendRequest("/reservation/complete", 200, "POST", { amount: Constants.SCREENING_BASE_SEAT_PRICE, reservationIds: [1] }, authenticatedCookie);
            expect(response.body).toHaveProperty("reservations");
            expect(response.body.reservations[0]).toHaveProperty("type", Constants.RESERVATION_TYPES[1]);

            response = await Utils.sendRequest("/reservation/new", 400, "POST", Utils.reservationData, authenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });

            const unauthenticatedUserData = await Utils.createRegularUser(Utils.userDataUnauthenticated);
            unauthenticatedCookie = unauthenticatedUserData.cookie;
            unauthenticatedUser = unauthenticatedUserData.user;
        });

        it("should respond with 400 if seat id is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: 0 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, seatId: -1 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if screening id is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: 0 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId: -1 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/new", "POST", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/new", "POST", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/new", "POST", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 404 if screening or user or seat does not exist", async () => {
            // Non-existent seat
            response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, seatId: 99 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });

            // Non-existent screening
            response = await Utils.sendRequest("/reservation/new", 404, "POST", { ...Utils.reservationData, screeningId: 99 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        });
    });

    //---------------------------------
    // Step 1.5 - POST (Bulk)
    //---------------------------------
    // Bulk reservation for three seats is made
    // Then during the tests, one more reservation is made and then completed
    // To see whether the bulk reservation is updated correctly when a seat is already reserved/blocked
    // End state: 5 reservations exist in the database
    //---------------------------------

    describe("POST /reservation/new/bulk", async () => {

        it("should respond with 200 and create multiple reservation objects", async () => {
            response = await Utils.sendRequest("/reservation/new/bulk", 200, "POST", bulkData, unauthenticatedCookie);

            expect(response.body).toHaveProperty("reservations");
            expect(response.body.reservations).toHaveLength(3);

            for (const id of bulkData.seatIds) {
                const record = await Reservation.findOne({ where: { seatId: id, screeningId: 1 } });
                expect(record).not.toBeNull();
                expect(record?.userId).toBe(unauthenticatedUser.id);
            }
        });

        it("should respond with 400 if any required field is missing or null", async () => {
            const fields = ["type", "seatIds", "screeningId"];
            for (const field of fields) {
                // Check undefined
                response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, [field]: undefined }, unauthenticatedCookie);
                expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

                // Check null
                response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, [field]: null }, unauthenticatedCookie);
                expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
            }
            // All are undefined
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", {}, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // mixed invalid
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {
                type: null,
                seatId: undefined,
                screeningId: null,
            }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // All are null
            response = await Utils.sendRequest("/reservation/new", 400, "POST", {
                type: null,
                seatId: null,
                screeningId: null,
            }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        });

        it("should respond with 400 if types are incorrect (including array interior)", async () => {
            // type as number
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, type: 123 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatIds as a non-array
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: 2 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatIds array containing a string
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: [2, "3", 4] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // screeningId as string
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, screeningId: "1" }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        });

        it("should respond with 400 if any ID is below the typical minimum", async () => {
            // Invalid seatId in array
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: [2, 0, 4] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: [2, -1, 4] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            // Invalid screeningId
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, screeningId: 0 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, screeningId: -1 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if the moment of reservation is farther in the future than screening start date", async () => {
            response = await Utils.sendRequest("/screening/new", 200, "POST", { ...Utils.screeningData, startDate: Utils.createOffsetDate(-1) }, siteAdminCookie);
            const screeningId = response.body.screenings[0].id;

            response = await Utils.sendRequest("/reservation/new", 400, "POST", { ...Utils.reservationData, screeningId }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_DATE_EXPIRED, reservations: [] });
        });

        it("should handle collisions (BLOCKED/RESERVED) and ensure atomicity", async () => {
            // Try to bulk reserve [2, 5, 6]. Since 2 is BLOCKED, bulk reservation should fail
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: [2, 5, 6] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });

            // Manually reserve seat 3 first
            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 7 }, regularCookie);
            // expect(response.body).toEqual([]);
            const newReservation = response.body.reservations[0];
            await Utils.sendRequest(`/reservation/complete`, 200, "POST", { reservationIds: [newReservation.id], amount: Constants.SCREENING_BASE_SEAT_PRICE }, regularCookie);

            // Try to bulk reserve [newReservationId, 8, 9]. Since newReservationId points to RESERVED, it should fail.
            response = await Utils.sendRequest("/reservation/new/bulk", 400, "POST", { ...bulkData, seatIds: [newReservation.seatId, 8, 9] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });

            // 3. Verify atomicity: Seat 3 and 4 must NOT have reservations created
            const check5 = await Reservation.findOne({ where: { seatId: 5, screeningId: 1 } });
            const check6 = await Reservation.findOne({ where: { seatId: 6, screeningId: 1 } });
            expect(check5).toBeNull();
            expect(check6).toBeNull();
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/new/bulk", "POST", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/new/bulk", "POST", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/new/bulk", "POST", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 404 if any related resource does not exist", async () => {
            // One seat in the array doesn't exist
            response = await Utils.sendRequest("/reservation/new/bulk", 404, "POST", { ...bulkData, seatIds: [99, 2, 4] }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });

            // Screening doesn't exist
            response = await Utils.sendRequest("/reservation/new/bulk", 404, "POST", { ...bulkData, screeningId: 99 }, unauthenticatedCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // Testing collection fetching. Additional records are created:
    // - ID: 5 (Same screening, different seat)
    // - ID: 6 (Same seat, different screening)
    // Tests verify filtering by ID, Screening, User, and Seat.
    // End state: 6 reservations exist in the database
    //---------------------------------

    describe("GET /reservation/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all reservations", async () => {
            // Add a second reservation in a different seat
            await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 11 }, unauthenticatedCookie);

            response = await Utils.sendRequest("/reservation/all", 200, "GET", {}, siteAdminCookie);
            expect(response.body.reservations).toHaveLength(6);
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/all", "GET", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/all", "GET", {}, "reservations", true);
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all", async () => {
            await Utils.deletedAdminCheck("/reservation/all", "GET", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/all", "GET", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /all", async () => {
            await Utils.unauthorizedCheck("/reservation/all", "GET", {}, "reservations", regularCookie)
        });
    });

    describe("GET /reservation/all/screening/:screeningId", async () => {
        it("should respond with 200 and reservations for specific screening", async () => {
            response = await Utils.sendRequest("/reservation/all/screening/1", 200, "GET", {}, siteAdminCookie);
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(6);
        });

        it("should respond with 400 if screeningId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/reservation/all/screening",
                "GET",
                {},
                Messages.SCREENING_ERR_ID,
                "reservations",
                siteAdminCookie,
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/all/screening/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/all/screening/1", "GET", {}, "reservations", true);
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all/screening", async () => {
            await Utils.deletedAdminCheck("/reservation/all/screening/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/all/screening/1", "GET", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /all", async () => {
            await Utils.unauthorizedCheck("/reservation/all/screening/1", "GET", {}, "reservations", regularCookie)
        });

        it("should respond with 404 if specified screening object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/screening/99", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SCREENING_ERR_NOT_FOUND_GLOBAL, reservations: [] });
        });

        it("should respond with 404 if no screening objects are connected to the specified reservation object", async () => {
            // Create a new screening (ID 4) with no bookings
            await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, siteAdminCookie);
            response = await Utils.sendRequest("/reservation/all/screening/2", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_SCREENING, reservations: [] });
        });
    });

    describe("GET /reservation/all/user/:userId", async () => {
        it("should respond with 200 and reservations for specific user", async () => {
            response = await Utils.sendRequest(`/seat/all/1`, 200, "GET", {}, regularCookie);
            const lastSeatId = response.body.seats[response.body.seats.length - 1].id;

            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: lastSeatId }, regularCookie);

            response = await Utils.sendRequest(`/reservation/all/user/${regularUser.id}`, 200, "GET", {}, regularCookie);
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(2);
        });

        it("should respond with 400 if userId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/reservation/all/user",
                "GET",
                {},
                Messages.USER_ERR_ID,
                "reservations",
                siteAdminCookie,
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/all/user/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/all/user/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all/user/", async () => {
            await Utils.deletedAdminCheck("/reservation/all/user/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/all/user/1", "GET", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when an unauthorized user tries to access /all/user", async () => {
            await Utils.unauthorizedCheck("/reservation/all/user/1", "GET", {}, "reservations", unauthenticatedCookie)
        });

        it("should respond with 404 if specified user object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/user/99", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 404 if no user objects are connected to the specified reservation object", async () => {
            const unconnectedUser = await Utils.createRegularUser();

            response = await Utils.sendRequest(`/reservation/all/user/${unconnectedUser.user.id}`, 404, "GET", {}, unconnectedUser.cookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_USER, reservations: [] });
        });
    });

    describe("GET /reservation/all/seat/:seatId", async () => {
        it("should respond with 200 and reservations for specific seat", async () => {
            // Same seat, but different screening
            await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, screeningId: 4 }, siteAdminCookie);

            response = await Utils.sendRequest("/reservation/all/seat/1", 200, "GET", {}, siteAdminCookie);
            expect(response.body.reservations).toBeInstanceOf(Array);
            expect(response.body.reservations.length).toBe(2);
        });

        it("should respond with 400 if seatId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/reservation/all/seat",
                "GET",
                {},
                Messages.SEAT_ERR_ID,
                "reservations",
                siteAdminCookie,
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/all/seat/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/all/seat/1", "GET", {}, "reservations", true);
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all/seat", async () => {
            await Utils.deletedAdminCheck("/reservation/all/seat/1", "GET", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/all/seat/1", "GET", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /all", async () => {
            await Utils.unauthorizedCheck("/reservation/all/seat/1", "GET", {}, "reservations", regularCookie)
        });

        it("should respond with 404 if specified seat object is not found in the database", async () => {
            response = await Utils.sendRequest("/reservation/all/seat/99", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 404 if no seat objects are connected to the specified reservation object", async () => {
            await Utils.sendRequest("/room/new", 200, "POST", Utils.roomData, siteAdminCookie);
            response = await Utils.sendRequest("/seat/new", 200, "POST", { ...Utils.seatData, roomId: 2 }, siteAdminCookie);
            const seatId = response.body.seats[0].id;
            response = await Utils.sendRequest(`/reservation/all/seat/${seatId}`, 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_SEAT, reservations: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // Testing updates (seat change and type updates)
    // Record ID: 7 is created on an empty seat to test collisions with IDs 1 and 2
    // Tests verify 400 errors for occupied/blocked seats and 404 for missing seats
    // End state: 7 reservations exist in the database
    //---------------------------------

    describe("PUT /reservation/update/:reservationId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and move reservation to new seat", async () => {
            const updateData = { type: Constants.RESERVATION_TYPES[0], seatId: 5 };
            response = await Utils.sendRequest("/reservation/update/1", 200, "PUT", updateData, siteAdminCookie);
            expect(response.body.reservations[0]).toHaveProperty("type", updateData.type);
            expect(response.body.reservations[0]).toHaveProperty("seatId", updateData.seatId);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // all are null
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { type: null, seatId: null }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // all are undefined
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });

            // mixed invalid
            const mixedInvalid = {
                type: null,
                seatId: undefined,
            };
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", mixedInvalid, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_EMPTY_ARGS, reservations: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // type: not as string
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, type: 2 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });

            // seatId: not as integer
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { ...Utils.reservationData, seatId: "5" }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPING, reservations: [] });
        });

        it("should respond with 400 if updated type is invalid", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { type: "Not_in_enum" }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_TYPE, reservations: [] });
        });

        it("should respond with 400 if updated seat ID is invalid", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { seatId: -1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/update/1", 400, "PUT", { seatId: 0 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if specified seat corresponds to a reservation that's already in the database", async () => {
            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 12 }, unauthenticatedCookie);
            response = await Utils.sendRequest("/reservation/update/5", 400, "PUT", { type: Constants.RESERVATION_TYPES[1], seatId: 5 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_BLOCKED, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete", 200, "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, authenticatedCookie);
            response = await Utils.sendRequest("/reservation/update/5", 400, "PUT", { seatId: 5 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/update/1", "PUT", { seatId: 1 }, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/update/1", "PUT", {}, "reservations", true);
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update", async () => {
            await Utils.deletedAdminCheck("/reservation/update/1", "PUT", { seatId: 1 }, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/update/1", "PUT", { seatId: 1 }, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /update", async () => {
            await Utils.unauthorizedCheck("/reservation/update/1", "PUT", {}, "reservations", regularCookie)
        });

        it("should respond with 404 if reservation does not exist", async () => {
            response = await Utils.sendRequest("/reservation/update/99", 404, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND, reservations: [] });
        });

        it("should respond with 404 if specified seat is not in the database", async () => {
            response = await Utils.sendRequest("/reservation/update/1", 404, "PUT", { seatId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.SEAT_ERR_NOT_FOUND, reservations: [] });
        });
    });

    //---------------------------------
    // Step 4 - POST (Complete)
    //---------------------------------
    // Finalizing reservations (changing type to RESERVED).
    // Ensuring a user cannot finalize a reservation they don't own (400 error).
    // End state: 7 reservations exist in the database
    //---------------------------------

    describe("PUT /reservation/complete", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and set reservation type to confirmed", async () => {
            response = await Utils.sendRequest("/reservation/complete", 200, "POST", { reservationIds: [7], amount: Constants.SCREENING_BASE_SEAT_PRICE }, regularCookie);

            expect(response.body.reservations[0]).toHaveProperty("id", 7);
            expect(response.body.reservations[0]).toHaveProperty("type", Constants.RESERVATION_TYPES[1]);
        });

        it("should respond with 400 if reservationId is not a valid number", async () => {
            response = await Utils.sendRequest("/reservation/complete", 400, "POST", {  reservationIds: [0], amount: Constants.SCREENING_BASE_SEAT_PRICE }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: [-1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: ["abc"], amount: Constants.SCREENING_BASE_SEAT_PRICE }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_ID, reservations: [] });
        });

        it("should respond with 400 if reservation is already completed (wrong type)", async () => {
            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, authenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_RESERVED, reservations: [] });
        });

        it("should respond with 400 if payment amount is invalid", async () => {
            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 24 }, regularCookie);
            const reservationId = response.body.reservations[0].id;

            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: [reservationId], amount: -1 }, regularCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_PAYMENT, reservations: [] });

            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: [reservationId], amount: 100 }, regularCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_PAYMENT, reservations: [] });
        });

        it("should respond with 400 if moment of completion is farther in the future than screening start date", async () => {
            response = await Utils.sendRequest("/screening/new", 200, "POST", Utils.screeningData, siteAdminCookie);
            const screeningId = response.body.screenings[0].id;

            response = await Utils.sendRequest("/reservation/new/bulk", 200, "POST", { ...bulkData, screeningId, seatIds: [10, 11]}, regularCookie);
            const reservationIds = response.body.reservations.map((r: any) => r.id);

            // Update screening start date to be in the past
            await Utils.sendRequest(`/screening/update/${screeningId}`, 200, "PUT", { startDate: Utils.createOffsetDate(-1) }, siteAdminCookie);

            response = await Utils.sendRequest("/reservation/complete", 400, "POST", { reservationIds: [...reservationIds], amount: reservationIds.length * Constants.SCREENING_BASE_SEAT_PRICE }, regularCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_DATE_EXPIRED, reservations: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /complete", async () => {
            await Utils.deletedAdminCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when an underprivileged user tries to access /complete", async () => {
            await Utils.unauthorizedCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations", unauthenticatedCookie)
        });

        it("should respond with 403 when an unauthorized user tries to access /complete", async () => {
            await Utils.unauthorizedCheck("/reservation/complete", "POST", { reservationIds: [1], amount: Constants.SCREENING_BASE_SEAT_PRICE }, "reservations", regularCookie)
        });

        it("should respond with 403 if reservation does not exist", async () => {
            response = await Utils.sendRequest("/reservation/complete", 403, "POST", { reservationIds: [99], amount: Constants.SCREENING_BASE_SEAT_PRICE }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, reservations: [] });
        });
    });

    //---------------------------------
    // Step 5 - DELETE
    //---------------------------------
    // Reservation with id 1 is deleted
    // Tests verify ID validation and 404 handling for non-existent or
    // already deleted records.
    // End state: 6 reservations exist in the database
    //---------------------------------

    describe("DELETE /reservation/delete/:reservationId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and delete reservation", async () => {
            response = await Utils.sendRequest("/reservation/delete/1", 200, "DELETE", {}, authenticatedCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_MSG_DEL });
        });

        it("should respond with 400 if reservationId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/reservation/delete",
                "DELETE",
                {},
                Messages.RESERVATION_ERR_ID,
                "reservations",
                siteAdminCookie
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/reservation/delete/1", "DELETE", {}, "reservations");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/reservation/delete/1", "DELETE", {}, "reservations");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /delete", async () => {
            await Utils.deletedAdminCheck("/reservation/delete/1", "DELETE", {}, "reservations");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/reservation/delete/1", "DELETE", {}, "reservations", siteAdminCookie)
        });

        it("should respond with 403 when an underprivileged user tries to access /delete", async () => {
            await Utils.unauthorizedCheck("/reservation/delete/1", "DELETE", {}, "reservations", unauthenticatedCookie)
        });

        it("should respond with 403 when an unauthorized user tries to access /delete", async () => {
            response = await Utils.sendRequest("/reservation/new", 200, "POST", { ...Utils.reservationData, seatId: 25 }, unauthenticatedCookie);
            const reservationId = response.body.reservations[0].id;

            await Utils.unauthorizedCheck(`/reservation/delete/${reservationId}`, "DELETE", {}, "reservations", regularCookie)
        });

        it("should respond with 404 if deleting non-existent ID", async () => {
            response = await Utils.sendRequest("/reservation/delete/99", 404, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND });
        });
    });

    //---------------------------------
    // Step 6 - GET (404)
    //---------------------------------
    // All reservations are deleted
    // Final state verification. Since the database is empty,
    // fetching all reservations must result in a 404 error
    //---------------------------------

    describe("GET (404) /reservation/all", async () => {
        it("should respond with 404 if database is empty", async () => {
            await Reservation.destroy({ where: {}, cascade: true })

            response = await Utils.sendRequest("/reservation/all", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.RESERVATION_ERR_NOT_FOUND_ALL, reservations: [] });
        });
    });
});
