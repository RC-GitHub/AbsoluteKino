import request from "supertest";
import app from "../src/server";

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