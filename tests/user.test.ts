import sequelize from "../src/models";
import * as Messages from "../src/messages";
import * as Constants from "../src/constants";
import * as Utils from "./utils";

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe("User Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First user object is created successfully
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 user object is in the database
    //---------------------------------

    describe("POST /user/register", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created user object", async () => {
            response = await Utils.sendRequest("/user/register", 200, "POST", Utils.userData);
            expect(response.body).toHaveProperty("users");
            expect(response.body.users[0]).toHaveProperty("id", 2);
            expect(response.body.users[0]).toHaveProperty("name", Utils.userData.name);
            expect(response.body.users[0]).toHaveProperty("email", Utils.userData.email);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // accountType: undefined or null
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, accountType: undefined });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, accountType: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });

            // All undefined
            response = await Utils.sendRequest("/user/register", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, name: 123 });
            expect(response.body).toEqual({ message: Messages.USER_ERR_TYPING, users: [] });

            // accountType: not a string
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, accountType: true });
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

        it("should respond with 400 if account type is not in Enum", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userData, accountType: "Hacker" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });

        it("should respond with 400 if unauthorized user does not provide email or phone number", async () => {
            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userDataUnauthorized, email: null, phoneNumber: null });
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });

            response = await Utils.sendRequest("/user/register", 400, "POST", { ...Utils.userDataUnauthorized, email: undefined, phoneNumber: undefined });
            expect(response.body).toEqual({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        });

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
    // Step 2 - GET
    //---------------------------------
    // 2 further user objects are created and then fetched
    // At the end of the step there are 3 user objects in the database
    //---------------------------------

    const unauthorizedPhoneNumber = "222333444";
    describe("GET /user/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all user objects", async () => {
            //Emulating Unauthorized users
            await Utils.sendRequest("/user/register", 200, "POST", { ...Utils.userDataUnauthorized });
            await Utils.sendRequest("/user/register", 200, "POST", { ...Utils.userDataUnauthorized, phoneNumber: unauthorizedPhoneNumber, email: null });

            response = await Utils.sendRequest("/user/all", 200, "GET");
            expect(response.body.users).toHaveLength(3);
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
    // Step 3 - PUT
    //---------------------------------
    // First user object is modified successfully
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
            response = await Utils.sendRequest("/user/update/2", 400, "PUT", { email: Utils.userDataUnauthorized.email });
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
    // Step 4 - PUT (Account Type)
    //---------------------------------
    // First user account type object is modified successfully
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

        it("should respond with 400 if updated account type is not in Enum", async () => {
            response = await Utils.sendRequest("/user/update-type/2", 400, "PUT", { accountType: "Hacker" });
            expect(response.body).toEqual({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        });
        
        it("should respond with 404 if user is not in the database", async () => {
            response = await Utils.sendRequest("/user/update-type/5", 404, "PUT");
            expect(response.body).toEqual({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
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