import sequelize from "../src/models";
import * as Messages from "../src/messages"
import * as Utils from "./utils"

beforeAll(async () => {
    await sequelize.sync({ force: true });  // Use force: true to drop tables and recreate them
});

afterAll(async () => {
    await sequelize.close(); // Clean up database connection
});

describe("POST /cinema/new", async () => {
    it("(MODEL EXAMPLE) should respond with 200 and the created cinema object", async () => {
        const response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);

        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas[0]).toHaveProperty("name", Utils.cinemaData.name);
        expect(response.body.cinemas[0]).toHaveProperty("address", Utils.cinemaData.address);
        expect(response.body.cinemas[0]).toHaveProperty("latitude", Utils.cinemaData.latitude);
        expect(response.body.cinemas[0]).toHaveProperty("longitude", Utils.cinemaData.longitude);
    });

    it("should respond with 400 if required fields are missing", async () => {
        const invalidCinemaData = {
            name: "Test Cinema",
            // address is missing
            latitude: 50.0615,
            longitude: 19.9383
        };

        const response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
    });

    it("should respond with 400 if required types are incorrect", async () => {
        const invalidCinemaDataName = { ...Utils.cinemaData, name: 20 };
        let response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataName);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataAddress = { ...Utils.cinemaData, address: 1 };
        response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataAddress);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataLatitude = { ...Utils.cinemaData, latitude: "180" };
        response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLatitude);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataLongitude = { ...Utils.cinemaData, longitude: "180" };
        response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLongitude);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
    });
    
    it("should respond with 400 if name is too short or too long", async () => {
        const invalidCinemaDataShortName = { ...Utils.cinemaData }
        invalidCinemaDataShortName.name = "";

        const responseShortName = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataShortName);
        expect(responseShortName.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });

        const invalidCinemaDataLongName =  { ...Utils.cinemaData }
        invalidCinemaDataLongName.name = "Example Example Example Example Example Example Example Example Example"
    
        const responseLongName = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLongName);   
        expect(responseLongName.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
    });

    it("should respond with 400 if address does not match RegExp", async () => {
        const invalidCinemaData = { ...Utils.cinemaData };
        invalidCinemaData.address = "Example St 123ab, Example City, Poland"; // LOCATION_NUMBER can't have more than one a-z character after it

        const response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
    });

    it("should respond with 400 if latitude is less than -90 or bigger than 90", async () => {
        const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
        invalidCinemaDataLowerBound.latitude = -100; // latitude should be a number between -90 and 90

        const responseLowerBound = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLowerBound);
        expect(responseLowerBound.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });

        const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
        invalidCinemaDataUpperBound.latitude = 100;

        const responseUpperBound = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataUpperBound);
        expect(responseUpperBound.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
    });

    it("should respond with 400 if longitude is less than -180 or bigger than 180", async () => {
        const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
        invalidCinemaDataLowerBound.longitude = -200; // latitude should be a number between -90 and 90

        const responseLowerBound = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLowerBound);
        expect(responseLowerBound.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });

        const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
        invalidCinemaDataUpperBound.longitude = 200;

        const responseUpperBound = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataUpperBound);
        expect(responseUpperBound.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
    });
});

describe("GET /cinema/all", async () => {
    it("(MODEL EXAMPLE) should respond with 200 and all cinema objects in the database", async () => {
        const response = await Utils.sendRequest("/cinema/all", 200, "GET");
        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas).toBeInstanceOf(Array);
        expect(response.body.cinemas.length).toBeGreaterThan(0);
    });
});

describe("GET /cinema/id/:cinemaId", async () => {
    it("(MODEL EXAMPLE) should respond with 200 and the found cinema object", async () => {
        const response = await Utils.sendRequest("/cinema/id/1", 200, "GET");
        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas).toBeInstanceOf(Array);
        expect(response.body.cinemas.length).toBeGreaterThan(0);
        expect(response.body.cinemas[0]).toHaveProperty("name", Utils.cinemaData.name);
    });

    it("should respond with 400 if cinemaId is not valid", async () => {
        const response = await Utils.sendRequest("/cinema/id/abc", 400, "GET", Utils.cinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
    });
});

describe("PUT /cinema/update/:cinemaId", async () => {
    it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
        const cinemaDataUpdated =  { ...Utils.cinemaData };
        cinemaDataUpdated.name = "Test Cinema v2";

        const response = await Utils.sendRequest("/cinema/update/1", 200, "PUT", cinemaDataUpdated);

        expect(response.body).toHaveProperty("cinemas");
        expect(response.body.cinemas).toBeInstanceOf(Array);
        expect(response.body.cinemas.length).toBeGreaterThan(0);
        expect(response.body.cinemas[0]).toHaveProperty("name", cinemaDataUpdated.name);
    });

    it("should respond with 400 if cinemaId is not valid", async () => {
        const response = await Utils.sendRequest("/cinema/update/abc", 400, "PUT", Utils.cinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
    });

    it("should respond with 400 if all fields are missing", async () => {
        const responseEmptyObject = await Utils.sendRequest("/cinema/update/1", 400, "PUT", {});
        expect(responseEmptyObject.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });

        const responseUndefinedObject = await Utils.sendRequest("/cinema/update/1", 400, "PUT", {name: undefined, address: undefined, latitude: undefined, longitude: undefined});
        expect(responseUndefinedObject.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
    });

    it("should respond with 400 if required types are incorrect", async () => {
        const invalidCinemaDataName = { ...Utils.cinemaData, name: 20 };
        let response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataName);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataAddress = { ...Utils.cinemaData, address: 1 };
        response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataAddress);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataLatitude = { ...Utils.cinemaData, latitude: "180" };
        response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLatitude);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });

        const invalidCinemaDataLongitude = { ...Utils.cinemaData, longitude: "180" };
        response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLongitude);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_TYPING, cinemas: [] });
    });

    it("should respond with 400 if name is too short or too long", async () => {
        const invalidCinemaDataShortName = { ...Utils.cinemaData }
        invalidCinemaDataShortName.name = "";

        const responseShortName = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataShortName);
        expect(responseShortName.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });

        const invalidCinemaDataLongName =  { ...Utils.cinemaData }
        invalidCinemaDataLongName.name = "Example Example Example Example Example Example Example Example Example Example Example Example Example Example Example"
    
        const responseLongName = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLongName);   
        expect(responseLongName.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
    });

    it("should respond with 400 if address does not match RegExp", async () => {
        const invalidCinemaData = { ...Utils.cinemaData };
        invalidCinemaData.address = "Example St 123ab, Example City, Poland"; // LOCATION_NUMBER can't have more than one a-z character after it

        const response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
    });

    it("should respond with 400 if latitude is less than -90 or bigger than 90", async () => {
        const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
        invalidCinemaDataLowerBound.latitude = -100; // latitude should be a number between -90 and 90

        const responseLowerBound = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLowerBound);
        expect(responseLowerBound.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });

        const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
        invalidCinemaDataUpperBound.latitude = 100;

        const responseUpperBound = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataUpperBound);
        expect(responseUpperBound.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
    });

    it("should respond with 400 if longitude is less than -180 or bigger than 180", async () => {
        const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
        invalidCinemaDataLowerBound.longitude = -200; // latitude should be a number between -90 and 90

        const responseLowerBound = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLowerBound);
        expect(responseLowerBound.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });

        const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
        invalidCinemaDataUpperBound.longitude = 200;

        const responseUpperBound = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataUpperBound);
        expect(responseUpperBound.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
    });
});

describe("DELETE /cinema/delete/:cinemaId", async () => {
    it("(MODEL EXAMPLE) should respond with 200 if cinema object is successfully deleted", async () => {
        const response = await Utils.sendRequest("/cinema/delete/1", 200, "DELETE");
        expect(response.body).toEqual({ message: Messages.CINEMA_MSG_DEL});
    });

    it("should respond with 400 if cinemaId is not valid", async () => {
        const response = await Utils.sendRequest("/cinema/delete/abc", 400, "DELETE", Utils.cinemaData);
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID });
    });
});

//---------------------------------
// 404 Cases
//---------------------------------

describe("(NOT FOUND) GET /cinema/all", async () => {
    it("should respond with 404 if no cinema objects are found in the database", async () => {
        const response = await Utils.sendRequest("/cinema/all", 404, "GET");
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND_ALL, cinemas: [] });
    });
});

describe("(NOT FOUND) GET /cinema/id/:cinemaId", async () => {
    it("should respond with 404 if specified cinema object is not found in the database", async () => {
        const response = await Utils.sendRequest("/cinema/id/1", 404, "GET");
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
    });
});


describe("(NOT FOUND) PUT /cinema/update/:cinemaId", async () => {
    it("should respond with 404 if specified cinema object is not found in the database", async () => {
        const response = await Utils.sendRequest("/cinema/update/1", 404, "PUT", Utils.cinemaData); 
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
    });
});

describe("(NOT FOUND) DELETE /cinema/delete/:cinemaId", async () => {
    it("should respond with 404 if specified cinema object is not found in the database", async () => {
        const response = await Utils.sendRequest("/cinema/delete/1", 404, "DELETE", Utils.cinemaData); 
        expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND });
    });
});