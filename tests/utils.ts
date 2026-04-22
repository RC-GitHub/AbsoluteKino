import request from "supertest";
import app from "../src/server";

import * as Constants from "../src/constants";
import * as Messages from "../src/messages";

import { registerSiteAdmin, elevateToSiteAdmin, deleteSiteAdmin } from "../src/owner";
import { UserInstance } from "../src/models";


export const cinemaData = {
    name: "Test Cinema",
    address: "Example St 123a, Example City, Poland",
    latitude: 50.0615,
    longitude: 19.9383
};

export const roomData = {
    name: "Test Room",
    width: Constants.ROOM_WIDTH_DEF_VAL,
    depth: Constants.ROOM_DEPTH_DEF_VAL,
    rowAmount: Constants.ROOM_ROWS_DEF_VAL,
    colAmount: Constants.ROOM_COLS_DEF_VAL,
    cinemaId: 1
}

export const roomDataWithStairs = {
    ...roomData,
    stairsPlacements: [
        { x: 200, width: 60 },
        { x: 700, width: 60 }
    ]
}

export const seatData = {
    x: 200,
    y: 300,
    width: Constants.SEAT_WIDTH_DEF_VAL,
    depth: Constants.SEAT_DEPTH_DEF_VAL,
    row: 1,
    column: 2,
    type: Constants.SEAT_TYPES[0],
    roomId: 1,
};

export const movieData = {
    title: "Test Movie",
    viewingFormat: Constants.MOVIE_STD_VIEWING_FORMATS[0],
    duration: 120,
    description: "A truly great movie containing themes and such",
    posterUrl: "https://poster.com/123",
    trailerUrl: "https://trailer.com/123",
    language: "English",
    premiereDate: new Date("12-12-2000"),
    genre: "Action",
    restrictions: Constants.MOVIE_AGE_RESTRICTIONS[3],
    cast: "Michael Mind, Louis Armstrong",
    director: "Quentin Tarantino"
}

export const screeningData = {
    startDate: new Date(),
    basePrice: Constants.SCREENING_BASE_SEAT_PRICE,
    roomId: 1,
    movieId: 1
}

export const userData = {
    name: "Test User",
    password: "Test password",
    email: "test-mail@email.com",
    phoneNumber: "+48512616092"
}

export const userDataUnauthorized = {
    name: null,
    password: null,
    email: null,
    phoneNumber: null
}

export const reservationData = {
    type: Constants.RESERVATION_TYPES[0],
    seatId: 1,
    screeningId: 1,
    userId: 1
};

export const productData = {
    name: "Nachos",
    price: 8.50,
    size: "Medium",
    discount: 0,
    cinemaId: 1
};

export const generateUniqueEmail = () => {
    return `unique_${Date.now()}@test.com`;
}

export async function sendRequest(
    endPoint: string, 
    httpStatus: number, 
    type: string, 
    requestData = {}, 
    cookie: string | string[] | null = null
) {
    try {
        let req;
        switch (type.toUpperCase()) {
            case "GET":
                req = request(app).get(endPoint).send(requestData);
                break;
            case "PUT":
                req = request(app).put(endPoint).send(requestData);
                break;
            case "DELETE":
                req = request(app).delete(endPoint).send(requestData);
                break;
            default:
                req = request(app).post(endPoint).send(requestData);
                break;
        }

        if (cookie) {
            req.set("Cookie", cookie as any);
        }
        return await req.expect("Content-Type", /json/).expect(httpStatus);

    } catch (error: any) {
        console.error(`\n [Test Request Error]`);
        console.error(` Target: ${type.toUpperCase()} ${endPoint}`);
        console.error(` Expected Status: ${httpStatus}`);
        
        if (error.response) {
            console.error(` Actual Status: ${error.response.status}`);
            console.error(` Actual Body:`, JSON.stringify(error.response.body, null, 2));
            
            if (error.response.text && !error.response.body) {
                console.error(` Raw Text (First 200 chars): ${error.response.text.substring(0, 200)}...`);
            }
        } else {
            console.error(` Message: ${error.message}`);
        }
        console.error(`---------------------------\n`);
        
        throw error;
    }
}

// User operations

export async function createRegularUser(
    regularData = { 
        name: userData.name,
        password: userData.password,
        email: generateUniqueEmail()
    }
) {
    const regularRes = await sendRequest("/user/register", 200, "POST", regularData);
    const regularCookie = regularRes.get("Set-Cookie");
    const regularUser = regularRes.body.users[0];

    const adjustedUser = {
        ...regularUser,
        password: regularData.password
    }
    
    return { cookie: regularCookie, user: adjustedUser }
}

export async function createSiteAdmin(
    adminData = { 
        name: "New site admin", 
        password: "Admin password", 
        email: generateUniqueEmail() 
    }
) {
    await registerSiteAdmin(adminData)
    const adminRes = await sendRequest("/user/login", 200, "POST", adminData);
    const siteAdminCookie = adminRes.get("Set-Cookie");
    const siteAdminUser = adminRes.body.users[0];

    return { cookie: siteAdminCookie, user: siteAdminUser };
}

export async function levelUserTo(
    user: UserInstance,
    level: number,
    cookie: string[] | undefined
) {
    if (!cookie) cookie = await getCookieFromUser(user);

    const response = await sendRequest(`/user/update-type/${user.id}`, 200, "PUT", { accountType: Constants.USER_ACC_TYPES[level] }, cookie);

    const updatedUser = response.body.users[0];
    const updatedCookie = await getCookieFromUser(user);

    return { cookie: updatedCookie, user: updatedUser };
}

export async function getUserFromCookie(
    cookie: string[] | undefined
) {
    const response = await sendRequest("/user/login", 200, "POST", {}, cookie);
    const user = response.body.users[0]

    if (!user) {
        throw new Error(response.body.message)
    } else {
        return user
    }
}

export async function getCookieFromUser(    
    userData: UserInstance
) {
    const response = await sendRequest("/user/login", 200, "POST",  { email: userData.email, password: userData.password }, null);
    const cookie = response.get("Set-Cookie");

    if (!cookie) {
        throw new Error(response.body.message)
    }
    else {
        return cookie
    }
}

export async function deleteAdminFromCookie(
    cookie: string[] | undefined
) {
    const user = await getUserFromCookie(cookie);
    const isDeleted = await deleteSiteAdmin(user.id);
    expect(isDeleted.message).toBe(Messages.USER_MSG_DEL_SUCCESS)
}

export async function deleteUser(
    user: UserInstance,
) {
    const cookie = await getCookieFromUser(user);
    const response = await sendRequest(`/user/delete/${user.id}`, 200, "DELETE", {}, cookie);
    expect(response.body).toEqual({ message: Messages.USER_MSG_DEL })
}

export async function deleteRegularWithCookie(
    cookie: string[] | undefined
) {
    let regularRes = await sendRequest("/user/login", 200, "POST", {}, cookie);
    const regularId = regularRes.body.users[0].id;

    regularRes = await sendRequest(`/user/delete/${regularId}`, 200, "DELETE", {}, cookie);
    expect(regularRes.body.message).toBe(Messages.USER_MSG_DEL)
}

// Checks

export const noCookieCheck = async (
    endPoint: string,
    method: string,
    requestData = {},
    arrayName: string | string[]) => 
{
    const expectedResponse: any = { message: Messages.AUTH_REQUIRED }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    const response = await sendRequest(endPoint, 401, method, requestData);
    expect(response.body).toEqual(expectedResponse);  
}

export const unauthorizedCheck = async (
    endPoint: string,
    method: string,
    requestData = {},
    arrayName: string | string[],
    cookie: string[] | undefined) => 
{
    const expectedResponse: any = { message: Messages.AUTH_FORBIDDEN }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }
    const response = await sendRequest(endPoint, 403, method, requestData, cookie);
    expect(response.body).toEqual(expectedResponse);  
}

export const deletedAdminCheck = async (
    endPoint: string,
    method: string,
    requestData = {},
    arrayName: string | string[]) => 
{
    const expectedResponse: any = { message: Messages.AUTH_SESSION }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    const siteAdminData = await createSiteAdmin();
    const siteAdminCookie = siteAdminData.cookie;
    await deleteAdminFromCookie(siteAdminCookie);

    const response = await sendRequest(endPoint, 401, method, requestData, siteAdminCookie);
    expect(response.body).toEqual(expectedResponse);
}

export const tamperedCookieCheck = async (
    endPoint: string, 
    method: string,
    requestData = {},
    arrayName: string | string[],
    cookie: string[] | undefined) => 
{
    const expectedResponse: any = { message: Messages.AUTH_SESSION }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    const cookies = cookie || [];
    if (cookies.length === 0) throw new Error("No cookies found to tamper with");

    const tamperedCookie = cookies.map(c => c.replace(".", ".tampered"));
    let response = await sendRequest(endPoint, 401, method, requestData, tamperedCookie);

    expect(response.body).toEqual(expectedResponse);

    const setCookieHeader = response.get("Set-Cookie") || []; 
    const isCookieCleared = setCookieHeader.some(header => 
        header.includes("Max-Age=0") || header.includes("1970")
    );

    expect(isCookieCleared).toBe(true);
}

export const boundsCheck = async (
    endPoint: string,
    method: string,
    requestData = {},
    lowerBound: number,
    upperBound: number,
    errorMsg: string,
    propertyName: string,
    propertyType: ( "string" | "number" ),
    arrayName: string | string[],
    cookie: string[] | undefined = undefined) =>    
{
    let response;
    const expectedResponse: any = { message: errorMsg };
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    //Too short
    if (propertyType === "string") {
        if (lowerBound === 1) {
            response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: "" }, cookie);
            expect(response.body).toEqual(expectedResponse);
            response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: "  " }, cookie);
            expect(response.body).toEqual(expectedResponse);
        }
        else if (lowerBound > 1) {
            const lowValue = "a".repeat(lowerBound - 1);
            response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: lowValue }, cookie);
            expect(response.body).toEqual(expectedResponse);
        }

        //Too long
        const highValue = "a".repeat(upperBound + 1)
        response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: highValue }, cookie);
        expect(response.body).toEqual(expectedResponse);
    }
    else if (propertyType === "number") {
        // Too small
        const lowValue = lowerBound - 1;
        response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: lowValue }, cookie);
        expect(response.body).toEqual(expectedResponse);

        // Too big
        const highValue = upperBound + 1
        response = await sendRequest(endPoint, 400, method, { ...requestData, [propertyName]: highValue }, cookie);
        expect(response.body).toEqual(expectedResponse);
    }
    else {
        throw new Error("Property type is incorrect!");
    }
}

export const invalidIdCheck = async (    
    endPoint: string,
    method: string,
    requestData = {},
    errorMsg: string,
    arrayName: string | string[],
    cookie: string[] | undefined = undefined) =>    
{
    let response;
    const expectedResponse: any = { message: errorMsg }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    response = await sendRequest(`${endPoint}/abc`, 400, method, requestData, cookie);
    expect(response.body).toEqual(expectedResponse);

    response = await sendRequest(`${endPoint}/0`, 400, method, requestData, cookie);
    expect(response.body).toEqual(expectedResponse);

    response = await sendRequest(`${endPoint}/-1`, 400, method, requestData, cookie);
    expect(response.body).toEqual(expectedResponse);
}

export const freshTokenCheck = async (
    endPoint: string,
    method: string,
    requestData = {},
    arrayName: string | string[],
) => {
    const expectedResponse: any = { message: Messages.AUTH_SESSION }
    if (method !== "DELETE") {
        const arrayNames = Array.isArray(arrayName) ? arrayName : [arrayName];
        arrayNames.forEach(name => {
            expectedResponse[name] = [];
        });
    }

    const userData = await createRegularUser();
    const userCookie = userData.cookie;
    const user: UserInstance = userData.user;

    const logoutResponse = await sendRequest("/user/logout", 200, "POST", {}, userCookie);
    expect(logoutResponse.body.message).toBe(Messages.USER_MSG_LOGOUT);

    const response = await sendRequest(endPoint, 401, method, requestData, userCookie);
    expect(response.body).toEqual(expectedResponse);

    const setCookieHeader = response.get("Set-Cookie") || []; 
    const isCookieCleared = setCookieHeader.some(header => 
        header.includes("Max-Age=0") || header.includes("1970")
    );
    expect(isCookieCleared).toBe(true);

    const cleanupData = await getCookieFromUser(user);
    await deleteUser(user);
};