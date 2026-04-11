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
    chairPlacement: "A20, B15, C25; A20, B14, B15",
    cinemaId: 1
}

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
    roomId: 1,
    movieId: 1
}

export const userData = {
    name: "Test User",
    accountType: Constants.USER_ACC_TYPES[1],
    password: "Test password",
    email: "test-mail@email.com",
    phoneNumber: "+48512616092"
}

export const userDataUnauthorized = {
    name: null,
    accountType: Constants.USER_ACC_TYPES[0],
    password: null,
    email: "unauthorized@email.com",
    phoneNumber: null
}

export async function sendRequest(endPoint: string, httpStatus: number, type: string, requestData = {}) {
    switch (type.toUpperCase()) {
        case "GET": {
            return await request(app).get(endPoint).send(requestData).expect("Content-Type", /json/).expect(httpStatus)
            break;
        }
        case "PUT": {
            return await request(app).put(endPoint).send(requestData).expect("Content-Type", /json/).expect(httpStatus)
            break;
        }
        case "DELETE": {
            return await request(app).delete(endPoint).send(requestData).expect("Content-Type", /json/).expect(httpStatus)
            break;
        }
        default: {
            return await request(app).post(endPoint).send(requestData).expect("Content-Type", /json/).expect(httpStatus)
            break;
        }
    }
}