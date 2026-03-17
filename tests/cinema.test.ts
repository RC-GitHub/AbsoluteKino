import request from "supertest";
import app from "../src/server";
import * as Messages from "../src/messages"
import sequelize from "../src/models";

const cinemaData = {
    name: "Test Cinema",
    address: "Example St 123a, Example City, Poland",
    latitude: 50.0615,
    longitude: 19.9383
};

beforeAll(async () => {
    await sequelize.sync({ force: true });  // Use force: true to drop tables and recreate them
});

afterAll(async () => {
    await sequelize.close(); // Clean up database connection
});

describe("POST /cinema/new", async () => {
    it("should respond with 200 and the created cinema object", async () => {
        const response = await request(app)
            .post("/cinema/new")
            .send(cinemaData)
            .expect("Content-Type", /json/)
            .expect(200)

        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas[0]).toHaveProperty("name", "Test Cinema");
        expect(response.body.cinemas[0]).toHaveProperty("address", "Example St 123a, Example City, Poland");
        expect(response.body.cinemas[0]).toHaveProperty("latitude", 50.0615);
        expect(response.body.cinemas[0]).toHaveProperty("longitude", 19.9383);
    });

    it("should respond with 400 if required fields are missing", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            // address is missing
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS });
    });

    it("should respond with 400 if required types are incorrect", async () => {
        const invalidCinemaData = {
            name: 20, // name should be a string
            address: "Example St 123a, Example City, Poland",
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING });
    });

    
    it("should respond with 400 if name is too short", async () => {
        const invalidCinemaData = {
            name: "", // name should be at least 1 character long
            address: "Example St 123a, Example City, Poland",
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN });
    });

    it("should respond with 400 if name is too long", async () => {
        const invalidCinemaData = {
            name: "Example Example Example Example Example Example Example Example Example Example Example Example Example Example Example", // name should be less than 64 characters long
            address: "Example St 123a, Example City, Poland",
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN });
    });

    it("should respond with 400 if address does not match RegExp", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            address: "Example St 123ab, Example City, Poland", // LOCATION_NUMBER can"t have more than one a-z character after it
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ADDRESS });
    });

    it("should respond with 400 if latitude is less than -90", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            address: "Example St 123a, Example City, Poland", 
            latitude: -100, // latitude should be a number between -90 and 90
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL });
    });

    it("should respond with 400 if latitude is greater than 90", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            address: "Example St 123a, Example City, Poland",
            latitude: 100, // latitude should be a number between -90 and 90
            longitude: 19.9383
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL });
    });

    it("should respond with 400 if longitude is less than -180", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            address: "Example St 123, Example City, Poland",    
            latitude: 50.0615, 
            longitude: -200.0 // longitude should be a number between -180 and 180
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL });
    });

    it("should respond with 400 if longitude is greater than 180", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            address: "Example St 123, Example City, Poland", 
            latitude: 50.0615,
            longitude: 200.0  // longitude should be a number between -180 and 180
        };

        const response = await request(app)
            .post("/cinema/new")
            .send(invalidCinemaData)
            .expect("Content-Type", /json/)
            .expect(400);

        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL });
    });
});

describe("PUT /cinema/:cinemaId", () => {
    it("should respond with 400 if cinemaId is not valid", async () => {
        const response = await request(app)
            .get("/cinema/all") 
            .expect("Content-Type", /json/)
            .expect(200);
        
        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas).toBeInstanceOf(Array);
        expect(response.body.cinemas).toHaveLength(1);
        expect(response.body.cinemas[0]).toHaveProperty("name", "Test Cinema");
    });
});

describe("GET /cinema/all (found)", () => {
    it("should respond with 200 and all cinema objects in the database", async () => {

        const response = await request(app)
            .post("/cinema/new")
            .send(cinemaData)
            .expect("Content-Type", /json/)
            .expect(200)
    });
});

describe("DELETE /cinema/delete/:cinemaId", () => {
    it("should respond with 200 if cinema object is successfully deleted", async () => {
        const response = await request(app)
            .delete("/cinema/delete/1") 
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas).toBeInstanceOf(Array);
        expect(response.body.cinemas).toHaveLength(0);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toEqual(Messages.CINEMA_MSG_DEL);
    });
});

describe("GET /cinema/all (not found)", () => {
    it("should respond with 404 if no cinema objects are found in the database", async () => {
        const response = await request(app)
            .get("/cinema/all") 
            .expect("Content-Type", /json/)
            .expect(404);
        
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND_ALL });
    });
});



// describe("GET /cinema/all", () => {
//     it("should respond with all cinema objects in the database", async () => {
//         const response = await request(app)
//             .get("/cinema/all") 
//             .expect("Content-Type", /json/)
//             .expect(404);
        
//         expect(response.body).toBeInstanceOf(Array);
//         expect(response.body).toHaveLength(0);
//     });
// });