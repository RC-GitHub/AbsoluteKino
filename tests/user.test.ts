import sequelize from "../src/models";

import * as Utils from "./utils";
import * as Messages from "../src/messages";
import * as Constants from "../src/constants";

import { deleteSiteAdmin, registerSiteAdmin } from "../src/owner";

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe("User Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // Site admin is already present in the database
    // Second user object is created successfully
    // Then tests go over all cases which result in failure
    // At the end of the step 2 user objects are in the database
    //---------------------------------

    describe("POST /user/register", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created user object", async () => {
            response = await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);
            expect(response.body).toHaveProperty("users");
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
            //Too short
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, name: "" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, name: "  " });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });

            //Too long
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, name: "a".repeat(Constants.USER_NAME_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
        });

        // it("should respond with 400 if account type is not in Enum", async () => {
        //     response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, accountType: "Hacker" });
        //     expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        // });

        // it("should respond with 400 if unauthorized user does not provide email or phone number", async () => {
        //     response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userDataUnauthorized, email: null, phoneNumber: null });
        //     expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });

        //     response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userDataUnauthorized, email: undefined, phoneNumber: undefined });
        //     expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        // });

        it("should respond with 400 if password length is invalid", async () => {
            //Too short
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, password: "a".repeat(Constants.USER_PASS_MIN_LEN - 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, password: "" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, password: "  " });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });

            //Too long
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, password: "a".repeat(Constants.USER_PASS_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
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

    let firstCookie: string | undefined = ""

    describe("POST /user/login", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and set cookie when logging in with email", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", { 
                email: Utils.userData.email, 
                password: Utils.userData.password 
            });

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGIN);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);

            const cookies = response.get("Set-Cookie");
            const authCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(c => c?.includes("auth_token"));

            expect(authCookie).toBeDefined();
            expect(authCookie).toContain("auth_token");

            firstCookie = authCookie;    
        });

        it("should respond with 200 when a user is already logged-in", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", { 
                email: Utils.userData.email, 
                password: Utils.userData.password 
            }, firstCookie);

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
            expect(secondCookie).not.toEqual(firstCookie);
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
            //Too short
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, password: "a".repeat(Constants.USER_PASS_MIN_LEN - 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, password: "" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, password: "  " });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });

            //Too long
            response = await Utils.sendRequest("/user/login", 400, "POST", { ...Utils.userData, password: "a".repeat(Constants.USER_PASS_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
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
            response = await Utils.sendRequest("/user/logout", 200, "POST");
            
            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGOUT);
            expect(response.headers["set-cookie"][0]).toMatch(/auth_token=;|^auth_token=([^;]+);.*Max-Age=0/);
        });
    });

    //---------------------------------
    // Step 3 - GET
    //---------------------------------
    // 3 further user objects are created and then fetched
    // At the end of the step there are 5 user objects in the database
    //---------------------------------

    const unauthorizedPhoneNumber = "222333444";
    const otherEmail = Utils.generateUniqueEmail();

    let siteAdminCookie: string[] | undefined = []
    let unauthorizedCookie: string[] | undefined = []

    describe("GET /user/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all user objects", async () => {
            // Adding other users
            response = await Utils.sendRequest("/user/register", 200, "POST", Utils.userDataUnauthorized);
            unauthorizedCookie = response.get("Set-Cookie");

            await Utils.sendRequest("/user/register", 200, "POST",  { ...Utils.userData, email: otherEmail, phoneNumber: unauthorizedPhoneNumber });

            // Adding an admin user
            const adminData = { name: "New site admin", password: "Admin password", email: Utils.generateUniqueEmail() }
            await registerSiteAdmin(adminData)
            response = await Utils.sendRequest("/user/login", 200, "POST", adminData)
             
            siteAdminCookie = response.get("Set-Cookie");

            response = await Utils.sendRequest("/user/all", 200, "GET", {}, siteAdminCookie);
            expect(response.body.users.length).toBeGreaterThanOrEqual(4);
        });

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/all", 401, "GET", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /all", async () => {
            await Utils.deletedAdminCheck("users", "/user/all", "GET");    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/all", "GET", {}, siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /all", async () => {
            response = await Utils.sendRequest("/user/all", 403, "GET", {}, firstCookie);

            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
        });
    });

    describe("GET /user/id/:userId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the found user", async () => {
            response = await Utils.sendRequest("/user/id/2", 200, "GET", {}, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("id", 2);
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/id/abc", 400, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/id/0", 400, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/id/-1", 400, "GET", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/id/2", 401, "GET", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /id/:userId", async () => {
            await Utils.deletedAdminCheck("users", "/user/id/2", "GET");
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/id/2", "GET", {}, siteAdminCookie);
        });

        it("should respond with 403 when a regular user tries to access /id/:userId", async () => {
            response = await Utils.sendRequest("/user/id/2", 403, "GET", {}, firstCookie);

            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
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

    describe("PUT /user/update/:userId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const updatedData = { name: "Updated User Name" };
            response = await Utils.sendRequest("/user/update/2", 200, "PUT", updatedData, firstCookie);
            expect(response.body.users[0]).toHaveProperty("name", updatedData.name);
        });

        it("should respond with 200 and modified data when Site Admin is the one making a request", async () => {
            const updatedData = { name: "Updated User Name v2" };
            response = await Utils.sendRequest("/user/update/2", 200, "PUT", updatedData, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("name", updatedData.name);
        });

        it("should respond with 400 if specified user account type is Site Admin", async () => {
            // await elevateToSiteAdmin(1);
            response = await Utils.sendRequest("/user/update/5", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if update types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, name: 123 }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // password: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, password: true }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // email: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, email: {}}, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // phoneNumber: not a string or number
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: ["abc"] }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if updated name length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "  " }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });

            // too long
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "a".repeat(Constants.USER_NAME_MAX_LEN + 1) }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
        });

        it("should respond with 400 if unauthorized user does not provide email or phone number", async () => {
            response = await Utils.sendRequest("/user/update/3", 400, "PUT", { name: `Guest_${Date.now()}`, email: null, phoneNumber: null }, unauthorizedCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });

            response = await Utils.sendRequest("/user/update/3", 400, "PUT", { name: `Guest_${Date.now()}`, email: undefined, phoneNumber: undefined }, unauthorizedCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        });

        it("should respond with 400 if updated password length is invalid", async () => {
            //Too short
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "short" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "   " }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });

            //Too long
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "a".repeat(Constants.USER_PASS_MAX_LEN + 1) }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
        });

        it("should respond with 400 if updated email format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { email: "invalid_email" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL, users: [] });
        });

        it("should respond with 400 if email is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { email: otherEmail }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
        });

        it("should respond with 400 if updated phone format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: "abc" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: "abc".repeat(10) }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: "123" }, firstCookie); // Too short
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: "00123123123" }, firstCookie); //Starts with 0
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: 123 }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });
        });

        it("should respond with 400 if phone number is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: unauthorizedPhoneNumber }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/update/2", 401, "PUT", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update/:userId", async () => {
            await Utils.deletedAdminCheck("users", "/user/update/2", "PUT", { name: "Updated User Name v3" });    
        });

        it("should return 401 when accessing the route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/update/2", "PUT", { name: "Updated User Name v3" }, siteAdminCookie)
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/update/abc", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update/0", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update/-1", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 403 if provided cookie of a non-site-admin user does not match the specified user", async () => {
            response = await Utils.sendRequest("/user/update/3", 403, "PUT", {}, firstCookie);
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

    describe("PUT /user/update-type/:userId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and user object", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, firstCookie);
            expect(response.body.users[0]).toHaveProperty("accountType", Constants.USER_ACC_TYPES[2]);
        });
        
        it("should respond with 400 if specified user account type is Site Admin", async () => {
            response = await Utils.sendRequest("/user/update-type/1", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if updated account type is not in the Enum", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 400, "PUT", { accountType: "Hacker" }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });
        
        it("should respond with 400 if updated account type is site admin", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 400, "PUT", { accountType: Constants.USER_ACC_TYPES[3] }, firstCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 401, "PUT", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update-type/:userId", async () => {
            await Utils.deletedAdminCheck("users", "/user/update-type/2", "PUT", { accountType: Constants.USER_ACC_TYPES[2] });    
        });

        it("should return 401 when accessing the route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/update-type/2", "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, siteAdminCookie)
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/update-type/abc", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update-type/0", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update-type/-1", 400, "PUT", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 403 if provided cookie of a non-site-admin user does not match the specified user", async () => {
            response = await Utils.sendRequest("/user/update-type/3", 403, "PUT", {}, firstCookie);
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
        it("(MODEL EXAMPLE) should respond with 200 and user object with cinema data", async () => {
            // Create a Cinema
            const cinemaRes = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
            const createdCinema = cinemaRes.body.cinemas[0];

            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 2, cinemaId: 1 }, siteAdminCookie);
            expect(response.body.users[0]).toHaveProperty("id", 2);
            expect(response.body.users[0].cinemas[0]).toMatchObject({
                id: createdCinema.id,
                name: createdCinema.name,
                address: createdCinema.address
            });
        });

        it("should repond with 200 and verify the many-to-many link in the database state", async () => {
            await Utils.sendRequest("/user/update-type/3", 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2] }, siteAdminCookie)
            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 3, cinemaId: 1 }, siteAdminCookie);

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

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 401, "PUT", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /assign-cinema", async () => {
            await Utils.deletedAdminCheck("users", "/user/assign-cinema", "PUT");    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/assign-cinema", "PUT", {}, siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /assign-cinema", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 403, "PUT", {}, firstCookie);
            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
        });

        it("should respond with 404 for if specified user is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { userId: 99, cinemaId: 1 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });

        it("should respond with 404 for if specified cinema is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { userId: 2, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, users: [] });
        });
    });

    //---------------------------------
    // Step 7 - DELETE
    //---------------------------------
    // All user objects are being deleted one by one
    // At the end of this step there are no user objects in the database
    //---------------------------------

    describe("DELETE /user/delete/:userId", async () => {
        it("should respond with 403 when a regular user tries to access /delete/:userId", async () => {
            response = await Utils.sendRequest("/user/delete/2", 403, "DELETE", {}, firstCookie);
            expect(response.body).toEqual({ message: Messages.AUTH_FORBIDDEN, users: [] });
        });

        it("(MODEL EXAMPLE) should respond with 200 if user is deleted", async () => {
            await Utils.sendRequest("/user/delete/2", 200, "DELETE", {}, siteAdminCookie);
            await Utils.sendRequest("/user/delete/3", 200, "DELETE", {}, siteAdminCookie);
            response = await Utils.sendRequest("/user/delete/4", 200, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_MSG_DEL });

            await Utils.sendRequest("/cinema/delete/1", 200, "DELETE");
        });

        it("should respond with 400 if specified user account type is Site Admin", async () => {
            response = await Utils.sendRequest("/user/delete/5", 400, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_DEL_SITE });
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/delete/abc", 400, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });

            response = await Utils.sendRequest("/user/delete/0", 400, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });

            response = await Utils.sendRequest("/user/delete/-1", 400, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            response = await Utils.sendRequest("/user/delete/2", 401, "DELETE", {});
            expect(response.body).toEqual({ message: Messages.AUTH_REQUIRED, users: [] });   
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /delete/:userId", async () => {
            await Utils.deletedAdminCheck("users", "/user/delete/2", "DELETE");    
        });

        it("should return 401 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("users", "/user/delete/2", "DELETE", {}, siteAdminCookie)
        });

        it("should respond with 404 if user is already gone", async () => {
            response = await Utils.sendRequest("/user/delete/2", 404, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND });

            await deleteSiteAdmin(5);
        });
    });
});