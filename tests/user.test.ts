import sequelize from "../src/models";
import * as Messages from "../src/messages";
import * as Constants from "../src/constants";
import * as Utils from "./utils";
import { elevateToOwner, registerOwner, revokeSiteAdmin } from "../src/owner";

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const ownerInfo = await registerOwner();
    if (ownerInfo.message !== Messages.USER_OWNER) {
        console.error(Messages.APP_ERR_OWNER_LISTENING);
    }
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
            expect(response.body.users[0]).toHaveProperty("id", 2);
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

    describe("POST /user/login", async () => {

        let firstAuthToken = ""

        it("(MODEL EXAMPLE) should respond with 200 and set cookie when logging in with email", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", { 
                email: Utils.userData.email, 
                password: Utils.userData.password 
            });

            expect(response.body).toHaveProperty("message", Messages.USER_MSG_LOGIN);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);

            firstAuthToken = response.headers["set-cookie"][0];
            expect(response.headers["set-cookie"][0]).toContain("auth_token");
        });

        it("(MODEL EXAMPLE) should respond with 200 when logging in with phone number", async () => {
            response = await Utils.sendRequest("/user/login", 200, "POST", { 
                phoneNumber: Utils.userData.phoneNumber, 
                password: Utils.userData.password 
            });

            const expectedPhone = Utils.userData.phoneNumber.toString().replace(/\D/g, "");
            expect(response.body.users[0]).toHaveProperty("phoneNumber", expectedPhone);

            const secondAuthToken = response.headers["set-cookie"][0];
            expect(secondAuthToken).not.toEqual(firstAuthToken);
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
    // 2 further user objects are created and then fetched
    // At the end of the step there are 4 user objects in the database
    //---------------------------------

    const unauthorizedPhoneNumber = "222333444";
    const otherEmail = "other@email.com";
    describe("GET /user/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all user objects", async () => {
            // Adding other users
            await Utils.sendRequest("/user/register", 200, "POST", Utils.userDataUnauthorized);
            await Utils.sendRequest("/user/register", 200, "POST",  { ...Utils.userData, email: otherEmail, phoneNumber: unauthorizedPhoneNumber });

            response = await Utils.sendRequest("/user/all", 200, "GET");
            // Three created users 
            expect(response.body.users).toHaveLength(3);

            // Revoking site admin priviledges to show that /user/all only fetches non-site-admin users
            await revokeSiteAdmin(1);
            response = await Utils.sendRequest("/user/all", 200, "GET");
            expect(response.body.users).toHaveLength(4);
        });
    });

    describe("GET /user/id/:userId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the found user", async () => {
            response = await Utils.sendRequest("/user/id/2", 200, "GET");
            expect(response.body.users[0]).toHaveProperty("id", 2);
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/id/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/id/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/id/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 404 if user is not found", async () => {
            response = await Utils.sendRequest("/user/id/99", 404, "GET");
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
            response = await Utils.sendRequest("/user/update/2", 200, "PUT", updatedData);
            expect(response.body.users[0]).toHaveProperty("name", updatedData.name);
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/update/abc", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update/0", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update/-1", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 400 if user account type is site admin", async () => {
            await elevateToOwner(1);
            response = await Utils.sendRequest("/user/update/1", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if update types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, name: 123 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // password: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, password: true });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // email: not a string
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, email: {}});
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // phoneNumber: not a string or number
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: ["abc"] });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if updated name length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "  " });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });

            // too long
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { name: "a".repeat(Constants.USER_NAME_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NAME_LEN, users: [] });
        });

        it("should respond with 400 if unauthorized user does not provide email or phone number", async () => {
            response = await Utils.sendRequest("/user/update/3", 400, "PUT", { name: `Guest_${Date.now()}`, email: null, phoneNumber: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });

            response = await Utils.sendRequest("/user/update/3", 400, "PUT", { name: `Guest_${Date.now()}`, email: undefined, phoneNumber: undefined });
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        });

        it("should respond with 400 if updated password length is invalid", async () => {
            //Too short
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "short" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "   " });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });

            //Too long
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { password: "a".repeat(Constants.USER_PASS_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PASS_LEN, users: [] });
        });

        it("should respond with 400 if updated email format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { email: "invalid_email" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL, users: [] });
        });


        it("should respond with 400 if email is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { email: otherEmail });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
        });

        it("should respond with 400 if updated phone format is invalid", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: "abc" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: "abc".repeat(10) });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: "123" }); // Too short
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: "00123123123" }); //Starts with 0
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });

            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { phoneNumber: 123 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE, users: [] });
        });

        it("should respond with 400 if phone number is already in the database", async () => {
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { ...Utils.userData, phoneNumber: unauthorizedPhoneNumber });
            expect(response.body).toEqual({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
        });

        it("should respond with 404 if user is not in the database", async () => {
            response = await Utils.sendRequest("/user/update/99", 404, "PUT");
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
            response = await Utils.sendRequest("/user/update-type/2", 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2]});
            expect(response.body.users[0]).toHaveProperty("accountType", Constants.USER_ACC_TYPES[2]);
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/update-type/abc", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update-type/0", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/update-type/-1", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });
        
        it("should respond with 400 if user account type is site admin", async () => {
            response = await Utils.sendRequest("/user/update-type/1", 400, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        });

        it("should respond with 400 if updated account type is not in the Enum", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 400, "PUT", { accountType: "Hacker" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });
        
        it("should respond with 400 if updated account type is site admin", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 400, "PUT", { accountType: Constants.USER_ACC_TYPES[3] });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });

        it("should respond with 404 if user is not in the database", async () => {
            response = await Utils.sendRequest("/user/update-type/5", 404, "PUT");
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

            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 2, cinemaId: 1 });
            expect(response.body.users[0]).toHaveProperty("id", 2);
            expect(response.body.users[0].cinemas[0]).toMatchObject({
                id: createdCinema.id,
                name: createdCinema.name,
                address: createdCinema.address
            });
        });

        it("should respond with 400 when required fields are missing", async () => {
            // user id is undefined or null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: 1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: null, cinemaId: 1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // cinema id is undefined or null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 2 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 2, cinemaId: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All are undefined
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All are null
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: null, cinemaId: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // userId: not a integer
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: "123", cinemaId: 1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // cinemaId: not a integer
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: "123", userId: 2 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });
        });

        it("should respond with 400 if user ID is invalid", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: 0, cinemaId: 1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { userId: -1, cinemaId: 1 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID, users: [] });
        });

        it("should respond with 400 if cinema ID is invalid", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: 0, userId: 2 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });

            response = await Utils.sendRequest("/user/assign-cinema", 400, "PUT", { cinemaId: -1, userId: 2 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, users: [] });
        });

        it("should respond with 404 for if specified user is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { 
                userId: 99, 
                cinemaId: 1 
            });
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        });

        it("should respond with 404 for if specified cinema is not in the database", async () => {
            response = await Utils.sendRequest("/user/assign-cinema", 404, "PUT", { 
                userId: 2, 
                cinemaId: 99 
            });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, users: [] });
        });

        it("should verify the many-to-many link in the database state", async () => {
            await Utils.sendRequest("/user/update-type/3", 200, "PUT", { accountType: Constants.USER_ACC_TYPES[2] })
            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: 3, cinemaId: 1 });

            expect(response.body.users[0].cinemas[0]).toHaveProperty("id", 1);
        });
    });

    //---------------------------------
    // Step 5 - DELETE
    //---------------------------------
    // All user objects who have an account type lower than 'site owner' are being deleted one by one
    // At the end of this step there are no user objects in the database
    //---------------------------------

    describe("DELETE /user/delete/:userId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if user is deleted", async () => {
            await Utils.sendRequest("/user/delete/2", 200, "DELETE");
            await Utils.sendRequest("/user/delete/3", 200, "DELETE");
            response = await Utils.sendRequest("/user/delete/4", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_MSG_DEL });

            await Utils.sendRequest("/cinema/delete/1", 200, "DELETE");
        });

        it("(MODEL EXAMPLE) should respond with 400 if user is site admin", async () => {
            response = await Utils.sendRequest("/user/delete/1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_ERR_DEL_SITE });
        });

        it("should respond with 400 if userId is invalid", async () => {
            response = await Utils.sendRequest("/user/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });

            response = await Utils.sendRequest("/user/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });

            response = await Utils.sendRequest("/user/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_ERR_ID });
        });

        it("should respond with 404 if user is already gone", async () => {
            response = await Utils.sendRequest("/user/delete/2", 404, "DELETE");
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND });
        });
    });

    //---------------------------------
    // Step 6 - GET (404)
    //---------------------------------
    // Database is empty, fetching all should 404
    //---------------------------------

    describe("GET (404) /user/all", async () => {
        it("should respond with 404 if no users other than site owner exist", async () => {
            response = await Utils.sendRequest("/user/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND_ALL, users: [] });
        });
    });
});