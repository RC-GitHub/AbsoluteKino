import request from "supertest";
import app from "../src/server";
import * as Constants from "../src/constants";

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

export async function sendRequest(endPoint: string, httpStatus: number, type: string, requestData = {}) {
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