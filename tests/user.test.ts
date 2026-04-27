import sequelize, { Cinema, User, UserCinema, UserInstance } from "../src/models";

import * as Utils from "./utils";
import * as Messages from "../src/messages";
import * as Constants from "../src/constants";

import { deleteSiteAdmin, registerSiteAdmin } from "../src/owner";

let adminId: number;
let unauthorizedId: number;
let cinemaId: number;
let siteAdmin: Partial<UserInstance>;
let regularUser: Partial<UserInstance>;
let siteAdminCookie: string[] | undefined = []
let regularCookie: string[] | undefined = []
let unauthorizedCookie: string[] | undefined = []

const unauthorizedPhoneNumber = "222333444";
const otherEmail = Utils.generateUniqueEmail();

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await User.destroy({ where: {}, cascade: true })
    await Cinema.destroy({ where: {}, cascade: true })
    await UserCinema.destroy({ where: {}, cascade: true })
})

describe("User Lifecycle Flow", () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First user object is created successfully
    // Then tests go over all cases which result in failure
    // At the end of the step 1 user objects is in the database
    //---------------------------------

    describe("POST /user/register", () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created user object", async () => {
            response = await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);
            expect(response.body).toHaveProperty("users");
            expect(response.body.users[0]).toHaveProperty("id", 1);
            expect(response.body.users[0]).toHaveProperty("name", Utils.userData.name);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, name: 123 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // password: not a string
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, password: true });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // email: not a string
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, email: {}});
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // phoneNumber: not a string or number
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, phoneNumber: ["abc"] });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if name length is invalid", async () => {
            await Utils.boundsCheck(
                "/user/register",
                "POST",
                Utils.userData,
                Constants.USER_NAME_MIN_LEN,
                Constants.USER_NAME_MAX_LEN,
                Messages.USER_ERR_NAME_LEN,
                "name",
                "string",
                "users"
            )
        });

        it("should respond with 400 if password length is invalid", async () => {
            await Utils.boundsCheck(
                "/user/register",
                "POST",
                Utils.userData,
                Constants.USER_PASS_MIN_LEN,
                Constants.USER_PASS_MAX_LEN,
                Messages.USER_ERR_PASS_LEN,
                "password",
                "string",
                "users"
            )
        });

        it("should respond with 400 if email format is invalid", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, email: "invalid-email" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL, users: [] });
        });

        it("should respond with 400 if email is already in the database", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, phoneNumber: "222333444" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
        });

        it("should respond with 400 if phone number format is invalid", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, phoneNumber: "123" }); // Too short
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, phoneNumber: "00123123123" }); //Starts with 0
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });
        });

        it("should respond with 400 if phone number is already in the database", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, email: "different@mail.com" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
        });
    });

    //---------------------------------
    // Step 2 - Login / Logout
    //---------------------------------
    // Tests authentication using both Email and Phone Number
    // Verifies cookie settings and failure cases
    //---------------------------------

    describe("POST /user/login", () => {
        it("(MODEL EXAMPLE) should respond with 200 and set cookie when logging in with email", async () => {
            regularUser = {
                email: Utils.userData.email,
                password: Utils.userData.password
            }
            response = await Utils.sendRequest("/user/login", 200, "POST", regularUser);
            regularUser.id = response.body.users[0].id;

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGIN);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);

            const cookies = response.get("Set-Cookie");
            regularCookie = cookies;

            const authCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(c => c?.includes("auth_token"));
            expect(authCookie).toBeDefined();
            expect(authCookie).toContain("auth_token");
        });

        it("should respond with 200 when a user is already logged-in", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", {
                email: Utils.userData.email,
                password: Utils.userData.password
            }, regularCookie);

            expect(response.body).toHaveProperty("message", Messages.USER_ERR_ALREADY_LOGGED_IN);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);

            const cookies = response.get("Set-Cookie");
            expect(cookies).toBeUndefined();
        });

        it("(MODEL EXAMPLE) should respond with 200 when logging in with phone number", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", {
                phoneNumber: Utils.userData.phoneNumber,
                password: Utils.userData.password
            });

            const expectedPhone = Utils.userData.phoneNumber.toString().replace(/\D/g, "");
            expect(response.body.users[0]).toHaveProperty("phoneNumber", expectedPhone);

            const cookies = response.get("Set-Cookie");
            const authCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(c => c?.includes("auth_token"));

            expect(authCookie).toBeDefined();
            expect(authCookie).toContain("auth_token");

            const secondCookie = authCookie;
            expect(secondCookie).not.toEqual(regularCookie);
        });

        it("should responde with 200 and ignore an expired/invalid cookie, clear it, and allow normal login", async () => {
            const badCookie = "auth_token=this.is.not.a.valid.jwt; Path=/; HttpOnly";
            response = await Utils.sendRequest("/user/login", 200, "POST", {
                email: Utils.userData.email,
                password: Utils.userData.password
            }, badCookie);

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGIN);

            const setCookieHeader = response.get("Set-Cookie") || [];

            expect(setCookieHeader.length).toBeGreaterThan(0);
            expect(setCookieHeader[0]).toContain("auth_token");
            expect(setCookieHeader[0]).not.toContain("this.is.not.a.valid.jwt");
        });

        it("should respond with 400 if credentials (email/phone) are missing", async () => {
            // Missing password
            response = await Utils.sendRequest("/user/login", 400, "POST", { email: Utils.userData.email });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // Missing both identifiers
            response = await Utils.sendRequest("/user/login", 400, "POST", { password: Utils.userData.password });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All arguments are undefined
            response = await Utils.sendRequest("/user/login", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All arguments are null
            response = await Utils.sendRequest("/user/login", 400, "POST", { email: null, phoneNumber: null, password: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // Mixed invalid
            response = await Utils.sendRequest("/user/login", 400, "POST", { email: null, phoneNumber: undefined, password: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        });

        it("should respond with 400 if email format is invalid", async () => {
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, email: "invalid-email" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL, users: [] });
        });

        it("should respond with 400 if phone number format is invalid", async () => {
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, phoneNumber: "123" }); // Too short
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, phoneNumber: "00123123123" }); //Starts with 0
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });
        });

        it("should respond with 400 if password length is invalid", async () => {
            await Utils.boundsCheck(
                "/user/login",
                "POST",
                Utils.userData,
                Constants.USER_PASS_MIN_LEN,
                Constants.USER_PASS_MAX_LEN,
                Messages.USER_ERR_PASS_LEN,
                "password",
                "string",
                "users"
            )
        });

        it("should respond with 401 if user does not exist", async () => {
            response = await Utils.sendRequest("/user/login", 401, "POST", {
                email: "nonexistent@mail.com",
                password: "SomePassword123"
            });
            expect(response.body).toEqual({ message: Messages.USER_ERR_LOGIN, users: [] });
        });

        it("should respond with 401 if password is incorrect", async () => {
            response = await Utils.sendRequest("/user/login", 401, "POST", {
                email: Utils.userData.email,
                password: "WrongPassword"
            });
            expect(response.body).toEqual({ message: Messages.USER_ERR_LOGIN, users: [] });
        });
    });

    describe("POST /user/logout", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and clear the auth cookie", async () => {
            response = await Utils.sendRequest("/user/logout", 200, "POST", {}, regularCookie);

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGOUT);
            expect(response.headers["set-cookie"][0]).toMatch(/auth_token=;|^auth_token=([^;]+);.*Max-Age=0/);
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/logout", "POST", {}, "users");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/user/logout", "POST", {}, "users");
        });

        it("should respond with 401 when attempting to logout with a tampered cookie", async () => {
            const tempAdminCookie = (await Utils.createSiteAdmin()).cookie;
            await Utils.tamperedCookieCheck("/user/logout", "POST", {}, "users", tempAdminCookie);
        });

        it("should respond with 401 when a deleted user tries to logout", async () => {
            await Utils.deletedAdminCheck("/user/logout", "POST", {}, "users");
        });
    });

    //---------------------------------
    // Step 3 - GET
    //---------------------------------
    // 3 further user objects are created and then fetched
    // At the end of the step there are 5 user objects in the database
    //---------------------------------

    describe("GET /user/all", () => {
        it("(MODEL EXAMPLE) should respond with 200 and all user objects", async () => {
            // Adding other users
            response = await Utils.sendRequest("/user/register", 200, "POST", Utils.userDataUnauthenticated);
            unauthorizedCookie = response.get("Set-Cookie");
            unauthorizedId = response.body.users[0].id;

            await Utils.sendRequest("/user/register", 200, "POST",  { ...Utils.userData, email: otherEmail, phoneNumber: unauthorizedPhoneNumber });

            // Adding an admin user
            siteAdmin = { name: "New site admin", password: "Admin password", email: Utils.generateUniqueEmail() }
            await registerSiteAdmin(siteAdmin);

            response = await Utils.sendRequest("/user/login", 200, "POST", siteAdmin)
            siteAdminCookie = response.get("Set-Cookie");
            adminId = response.body.users[0].id;

            response = await Utils.sendRequest("/user/all", 200, "GET", {}, siteAdminCookie);
            expect(response.body.users.length).toBeGreaterThanOrEqual(4);
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/all", "GET", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all", async () => {
            await Utils.deletedAdminCheck("/user/all", "GET", {}, "users");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/all", "GET", {}, "users", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /all", async () => {
            regularCookie = await Utils.getCookieFromUser(regularUser as UserInstance);
            await Utils.unauthorizedCheck("/user/all", "GET", {}, "users", regularCookie);
        });
    });

    describe("GET /user/id/:userId", () => {
        it("(MODEL EXAMPLE) should respond with 200 and the found user", async () => {
            response = await Utils.sendRequest("/user/id/1", 200, "GET", {}, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("id", 1);
        });

        it("should respond with 400 if userId is invalid", async () => {
            await Utils.invalidIdCheck(
                "/user/id",
                "GET",
                {},
                Messages.USER_ERR_ID,
                "users",
                siteAdminCookie
            )
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/id/1", "GET", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /id/:userId", async () => {
            await Utils.deletedAdminCheck("/user/id/1", "GET", {}, "users");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/id/1", "GET", {}, "users", siteAdminCookie);
        });

        it("should respond with 403 when a regular user tries to access /id/:userId", async () => {
            await Utils.unauthorizedCheck("/user/id/1", "GET", {}, "users", regularCookie);
        });

        it("should respond with 404 if user is not found", async () => {
            response = await Utils.sendRequest("/user/id/99", 404, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });
    });

    //---------------------------------
    // Step 4 - PUT
    //---------------------------------
    // Second user object is modified successfully
    // Then tests go over all cases which result in update failure
    //---------------------------------

    describe("PUT /user/update/:userId", () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const updatedData = { name: "Updated User Name" };
            response = await Utils.sendRequest("/user/update/1", 200, "PUT", updatedData, regularCookie);
            expect(response.body.users[0]).toHaveProperty("name", updatedData.name);
        });

        it("should respond with 200 and modified data when Site Admin is the one making a request", async () => {
            const updatedData = { name: "Updated User Name v2" };
            response = await Utils.sendRequest("/user/update/1", 200, "PUT", updatedData, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("name", updatedData.name);
        });

        it("should respond with 400 if specified user account type is Site Admin", async () => {
            response = await Utils.sendRequest(`/user/update/${adminId}`, 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if update types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, name: 123 }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // password: not a string
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, password: true }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // email: not a string
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, email: {}}, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // phoneNumber: not a string or number
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, phoneNumber: ["abc"] }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if updated name length is invalid", async () => {
            await Utils.boundsCheck(
                "/user/update/1",
                "PUT",
                Utils.userData,
                Constants.USER_NAME_MIN_LEN,
                Constants.USER_NAME_MAX_LEN,
                Messages.USER_ERR_NAME_LEN,
                "name",
                "string",
                "users",
                regularCookie
            )
        });

        it("should respond with 400 if unauthorized user does not provide email or phone number", async () => {
            response = await Utils.sendRequest(`/user/update/${unauthorizedId}`, 400, "PUT", { name: `Guest_${Date.now()}`, email: null, phoneNumber: null }, unauthorizedCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });

            response = await Utils.sendRequest(`/user/update/${unauthorizedId}`, 400, "PUT", { name: `Guest_${Date.now()}`, email: undefined, phoneNumber: undefined }, unauthorizedCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        });

        it("should respond with 400 if updated password length is invalid", async () => {
            await Utils.boundsCheck(
                "/user/update/1",
                "PUT",
                Utils.userData,
                Constants.USER_PASS_MIN_LEN,
                Constants.USER_PASS_MAX_LEN,
                Messages.USER_ERR_PASS_LEN,
                "password",
                "string",
                "users",
                regularCookie
            )
        });

        it("should respond with 400 if updated email format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { email: "invalid_email" }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL, users: [] });
        });

        it("should respond with 400 if email is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { email: otherEmail }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
        });

        it("should respond with 400 if updated phone format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { phoneNumber: "abc" }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { phoneNumber: "abc".repeat(10) }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, phoneNumber: "123" }, regularCookie); // Too short
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, phoneNumber: "00123123123" }, regularCookie); //Starts with 0
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { phoneNumber: 123 }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });
        });

        it("should respond with 400 if phone number is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/1", 400, "PUT", { ...Utils.userData, phoneNumber: unauthorizedPhoneNumber }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/update/1", "PUT", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update/:userId", async () => {
            await Utils.deletedAdminCheck("/user/update/1", "PUT", { name: "Updated User Name v3" }, "users");
        });

        it("should respond with 401 when accessing the route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/update/1", "PUT", { name: "Updated User Name v3" }, "users", siteAdminCookie)
        });

        it("should respond with 400 if userId is invalid", async () => {
            await Utils.invalidIdCheck(
                "/user/update",
                "PUT",
                {},
                Messages.USER_ERR_ID,
                "users",
                siteAdminCookie
            )
        });

        it("should respond with 403 if provided cookie of a non-site-admin user does not match the specified user", async () => {
            response = await Utils.sendRequest("/user/update/2", 403, "PUT", {}, regularCookie);
            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
        });

        it("should respond with 404 if user is not in the database", async () => {
            response = await Utils.sendRequest("/user/update/99", 404, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });

    });

    //---------------------------------
    // Step 5 - PUT (Account Type)
    //---------------------------------
    // Second user account type object is modified successfully
    // Then tests go over all cases which result in update failure
    //---------------------------------

    describe("PUT /user/update-type/:userId", () => {
        it("(MODEL EXAMPLE) should respond with 200 and user object", async () => {
            response = await Utils.sendRequest("/user/update-type/1", 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("accountType", Constants.USER_ACC_TYPES[2]);
        });

        it("should respond with 400 if specified user account type is Site Admin", async () => {
            response = await Utils.sendRequest(`/user/update-type/${adminId}`, 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if updated account type is not in the Enum", async () => {
            response = await Utils.sendRequest("/user/update-type/1", 400, "PUT", { accountType: "Hacker" }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });

        it("should respond with 400 if updated account type is site admin", async () => {
            response = await Utils.sendRequest("/user/update-type/1", 400, "PUT", { accountType: Constants.USER_ACC_TYPES[3] }, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });

        it("should respond with 400 if user is underprivileged to change his account type to the specified one", async () => {
            response = await Utils.sendRequest("/user/register", 200, "POST", {});
            const newUser = response.body.users[0];
            const newUserCookie = response.get("Set-Cookie")

            response = await Utils.sendRequest(`/user/update-type/${newUser.id}`, 400, "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, newUserCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE_CHANGE, users: [] });

            await Utils.sendRequest(`/user/update-type/${newUser.id}`, 200, "PUT", { accountType: Constants.USER_ACC_TYPES[1] }, newUserCookie);

            response = await Utils.sendRequest(`/user/update-type/${newUser.id}`, 400, "PUT", { accountType: Constants.USER_ACC_TYPES[0] }, newUserCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE_CHANGE, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/update-type/1", "PUT", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update-type/:userId", async () => {
            await Utils.deletedAdminCheck("/user/update-type/1", "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, "users");
        });

        it("should respond with 401 when accessing the route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/update-type/1", "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, "users", siteAdminCookie)
        });

        it("should respond with 400 if userId is invalid", async () => {
            await Utils.invalidIdCheck(
                "/user/update-type",
                "PUT",
                {},
                Messages.USER_ERR_ID,
                "users",
                siteAdminCookie
            )
        });

        it("should respond with 403 if provided cookie of a non-site-admin user does not match the specified user", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 403, "PUT", {}, regularCookie);
            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
        });

        it("should respond with 404 if user is not in the database", async () => {
            response = await Utils.sendRequest("/user/update-type/99", 404, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });
    });

    //---------------------------------
    // Step 6 - PUT (Assign Cinemas)
    //---------------------------------
    // Three cinema objects are created
    // One of them is assigned to the second user object
    // The other is unsuccessfully assigned to a non-admin user
    // The last one is left alone, to test fetching
    // At the end of the step there are 3 cinemas and 4 users in the database
    //---------------------------------

    describe("PUT /user/assign-cinema", () => {
        it("(MODEL EXAMPLE) should respond with 200 and elevated user object with cinema data", async () => {
            // Create a Cinema
            const cinemaRes = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            const createdCinema = cinemaRes.body.cinemas[0];
            cinemaId = createdCinema.id;

            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 1, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("id", 1);
            expect(response.body.users[0]).toHaveProperty("accountType", Constants.USER_ACC_TYPES[2]);
            expect(response.body.users[0].cinemas[0]).toMatchObject({
                id: createdCinema.id,
                name: createdCinema.name,
                address: createdCinema.address
            });
        });

        it("should repond with 200 and verify the many-to-many link in the database state", async () => {
            response = await Utils.sendRequest("/user/register", 200, "POST", {}, siteAdminCookie);
            const id = response.body.users[0].id;

            await Utils.sendRequest(`/user/update-type/${id}`, 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, siteAdminCookie)

            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 6, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body.users[0].cinemas[0]).toHaveProperty("id", 1);
        });

        it("should respond with 400 when required fields are missing", async () => {
            // user id is undefined or null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: null, cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // cinema id is undefined or null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 2 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 2, cinemaId: null }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All are undefined
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All are null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: null, cinemaId: null }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // userId: not a integer
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: "123", cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // cinemaId: not a integer
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: "123", userId: 2 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if user ID is invalid", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 0, cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: -1, cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 400 if cinema ID is invalid", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: 0, userId: 2 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: -1, userId: 2 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });
        });

        it("should respond with 400 if user account type is site-admin or unauthorized", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: adminId, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] })

            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: unauthorizedId, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] })
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/assign-cinema", "PUT", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /assign-cinema", async () => {
            await Utils.deletedAdminCheck("/user/assign-cinema", "PUT", {}, "users");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/assign-cinema", "PUT", {}, "users", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /assign-cinema", async () => {
            await Utils.unauthorizedCheck("/user/assign-cinema", "PUT", {}, "users", regularCookie);
        });

        it("should respond with 404 for if specified user is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { userId: 99, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });

        it("should respond with 404 for if specified cinema is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { userId: unauthorizedId, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, users: [] });
        });
    });

    //---------------------------------
    // Step 7 - DELETE (Unassign Cinemas)
    //---------------------------------
    // The connection between a user and a cinema is removed
    // Tests verify the removal of the link in the database state
    // Then tests go over all cases which result in failure
    //---------------------------------

    describe("DELETE /user/unassign-cinema", () => {
        it("(MODEL EXAMPLE) should respond with 200 and the user object without the unassigned cinema", async () => {
            response = await Utils.sendRequest("/user/unassign-cinema", 200, "DELETE", {
                userId: 1,
                cinemaId: cinemaId
            }, siteAdminCookie);

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_CINEMA_UNASSIGN);
            expect(response.body.users[0]).toHaveProperty("id", 1);

            const userCinemas = response.body.users[0].cinemas;
            const found = userCinemas.find((c: any) => c.id === cinemaId);
            expect(found).toBeUndefined();
        });

        it("should respond with 400 when required fields are missing", async () => {
            // Missing userId
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: null, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // Missing cinemaId
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { cinemaId: null, userId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        });

        it("should respond with 400 when field types are incorrect", async () => {
            // userId as string
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: "1", cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // cinemaId as string
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: 1, cinemaId: "1" }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 when IDs are below minimum value", async () => {
            // Invalid userId
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: 0, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: -1, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            // Invalid cinemaId
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: 1, cinemaId: 0 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });
            response = await Utils.sendRequest("/user/unassign-cinema", 400, "DELETE", { userId: 1, cinemaId: -1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/unassign-cinema", "DELETE", { userId: 1, cinemaId: cinemaId }, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /assign-cinema", async () => {
            await Utils.deletedAdminCheck("/user/unassign-cinema", "DELETE", { userId: 1, cinemaId: cinemaId }, "users");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/unassign-cinema", "DELETE", { userId: 1, cinemaId: cinemaId }, "users", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to unassign a cinema", async () => {
            await Utils.unauthorizedCheck("/user/unassign-cinema", "DELETE", { userId: 1, cinemaId: cinemaId }, "users", regularCookie);
        });

        it("should respond with 404 when user does not exist", async () => {
            response = await Utils.sendRequest("/user/unassign-cinema", 404, "DELETE", { userId: 99, cinemaId: cinemaId }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });

        it("should respond with 404 when cinema does not exist", async () => {
            response = await Utils.sendRequest("/user/unassign-cinema", 404, "DELETE", { userId: 1, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, users: [] });
        });

        it("should respond with 200 even if the connection did not exist", async () => {
            // Try to unassign the same cinema again
            response = await Utils.sendRequest("/user/unassign-cinema", 200, "DELETE", {
                userId: 1,
                cinemaId: cinemaId
            }, siteAdminCookie);

            expect(response.body.users[0].cinemas.length).toBe(0);
        });
    });

    //---------------------------------
    // Step 8 - DELETE
    //---------------------------------
    // All user objects are being deleted one by one
    // At the end of this step there are no user objects in the database
    //---------------------------------

    describe("DELETE /user/delete/:userId", () => {
        it("(MODEL EXAMPLE) should respond with 200 if user is deleted", async () => {
            response = await Utils.sendRequest(`/user/delete/${regularUser.id}`, 200, "DELETE", {}, regularCookie);
            expect(response.body).toEqual({ message: Messages.USER_MSG_DEL });
        });

        it("should respond with 400 if specified user account type is Site Admin", async () => {
            response = await Utils.sendRequest(`/user/delete/${adminId}`, 400, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_DEL_SITE });
        });

        it("should respond with 400 if userId is invalid", async () => {
            await Utils.invalidIdCheck(
                "/user/delete",
                "DELETE",
                {},
                Messages.USER_ERR_ID,
                "users",
                siteAdminCookie
            )
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/user/delete/1", "DELETE", {}, "users");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /delete/:userId", async () => {
            await Utils.deletedAdminCheck("/user/delete/1", "DELETE", {}, "users");
        });

        it("should respond with 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/user/delete/1", "DELETE", {}, "users", siteAdminCookie)
        });

        it("should respond with 403 when an unauthorized user tries to access /delete/:userId", async () => {
            await Utils.unauthorizedCheck(`/user/delete/${unauthorizedId}`, "DELETE", {}, "users", unauthorizedCookie);
        });

        it("should respond with 404 if user is already gone", async () => {
            response = await Utils.sendRequest("/user/delete/1", 404, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND });
        });
    });
});
