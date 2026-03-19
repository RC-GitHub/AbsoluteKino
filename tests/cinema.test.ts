import sequelize from "../src/models";
import * as Messages from "../src/messages"
import * as Utils from "./utils"

beforeAll(async () => {
    await sequelize.sync({ force: true });  
});

describe("Cinema Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First cinema object is created successfully
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 cinema object is in the database
    //---------------------------------

    describe("POST /cinema/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created cinema object", async () => {
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
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
            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });

            response = await Utils.sendRequest("/cinema/new", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });

            response = await Utils.sendRequest("/cinema/new", 400, "POST", {name: "  ", address: undefined, latitude: null, longitude: undefined});
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            const invalidCinemaDataName = { ...Utils.cinemaData, name: 20 };
            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataName);
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

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataShortName);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });

            const invalidCinemaDataLongName =  { ...Utils.cinemaData }
            invalidCinemaDataLongName.name = "Example Example Example Example Example Example Example Example Example"
        
            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLongName);   
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
        });

        it("should respond with 400 if address does not match RegExp", async () => {
            const invalidCinemaData = { ...Utils.cinemaData };
            invalidCinemaData.address = "Example St 123ab, Example City, Poland"; // LOCATION_NUMBER can't have more than one a-z character after it

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
        });

        it("should respond with 400 if latitude is less than -90 or bigger than 90", async () => {
            const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
            invalidCinemaDataLowerBound.latitude = -100; // latitude should be a number between -90 and 90

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLowerBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });

            const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
            invalidCinemaDataUpperBound.latitude = 100;

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataUpperBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
        });

        it("should respond with 400 if longitude is less than -180 or bigger than 180", async () => {
            const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
            invalidCinemaDataLowerBound.longitude = -200; // latitude should be a number between -90 and 90

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataLowerBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });

            const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
            invalidCinemaDataUpperBound.longitude = 200;

            response = await Utils.sendRequest("/cinema/new", 400, "POST", invalidCinemaDataUpperBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 3 further cinema objects are created and then fetched
    // After that cinema object with id 3 is being fetched which will result in a success and a failure
    // At the end of the step only 4 cinema objects are in the database
    //---------------------------------

    describe("GET /cinema/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all cinema objects in the database", async () => {

            // Creating 3 new cinemas to check if GET /cinema/all will fetch all cinemas in the database
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);

            response = await Utils.sendRequest("/cinema/all", 200, "GET");
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas).toBeInstanceOf(Array);
            expect(response.body.cinemas).toHaveLength(4);
        });
    });

    describe("GET /cinema/id/:cinemaId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the found cinema object", async () => {
            response = await Utils.sendRequest("/cinema/id/3", 200, "GET");
            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas).toBeInstanceOf(Array);
            expect(response.body.cinemas).toHaveLength(1);
            expect(response.body.cinemas[0]).toHaveProperty("name", Utils.cinemaData.name);
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/cinema/id/abc", 400, "GET", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });

            response = await Utils.sendRequest("/cinema/id/0", 400, "GET", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });

            response = await Utils.sendRequest("/cinema/id/-1", 400, "GET", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/cinema/id/5", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // First cinema object is modified successfully
    // Then tests go over all cases which result in update failure
    // At the end of the step only 4 cinema objects are in the database
    //---------------------------------

    describe("PUT /cinema/update/:cinemaId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const cinemaDataUpdated =  { ...Utils.cinemaData };
            cinemaDataUpdated.name = "Test Cinema v2";
            response = await Utils.sendRequest("/cinema/update/1", 200, "PUT", cinemaDataUpdated);

            expect(response.body).toHaveProperty("cinemas");
            expect(response.body.cinemas).toBeInstanceOf(Array);
            expect(response.body.cinemas).toHaveLength(1);
            expect(response.body.cinemas[0]).toHaveProperty("name", cinemaDataUpdated.name);
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/cinema/update/abc", 400, "PUT", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });

            response = await Utils.sendRequest("/cinema/update/0", 400, "PUT", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });

            response = await Utils.sendRequest("/cinema/update/-1", 400, "PUT", Utils.cinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, cinemas: [] });
        });

        it("should respond with 400 if all fields are missing", async () => {
            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", {name: null, address: undefined, latitude: null, longitude: undefined});
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_EMPTY_ARGS, cinemas: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            const invalidCinemaDataName = { ...Utils.cinemaData, name: 20 };
            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataName);
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

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataShortName);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });

            const invalidCinemaDataLongName =  { ...Utils.cinemaData }
            invalidCinemaDataLongName.name = "Example Example Example Example Example Example Example Example Example"

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLongName);   
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NAME_LEN, cinemas: [] });
        });

        it("should respond with 400 if address does not match RegExp", async () => {
            const invalidCinemaData = { ...Utils.cinemaData };
            invalidCinemaData.address = "Example St 123ab, Example City, Poland"; // LOCATION_NUMBER can't have more than one a-z character after it

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaData);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ADDRESS, cinemas: [] });
        });

        it("should respond with 400 if latitude is less than -90 or bigger than 90", async () => {
            const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
            invalidCinemaDataLowerBound.latitude = -100; // latitude should be a number between -90 and 90

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLowerBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });

            const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
            invalidCinemaDataUpperBound.latitude = 100;

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataUpperBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LATITUDE_VAL, cinemas: [] });
        });

        it("should respond with 400 if longitude is less than -180 or bigger than 180", async () => {
            const invalidCinemaDataLowerBound = { ...Utils.cinemaData } 
            invalidCinemaDataLowerBound.longitude = -200; // latitude should be a number between -90 and 90

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataLowerBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });

            const invalidCinemaDataUpperBound = { ...Utils.cinemaData } 
            invalidCinemaDataUpperBound.longitude = 200;

            response = await Utils.sendRequest("/cinema/update/1", 400, "PUT", invalidCinemaDataUpperBound);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_LONGITUDE_VAL, cinemas: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/cinema/update/5", 404, "PUT", Utils.cinemaData); 
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, cinemas: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All cinema objects are being deleted one by one
    // Then tests go over all cases which result in deletion failure
    // At the end of the step no cinema objects are in the database
    //---------------------------------

    describe("DELETE /cinema/delete/:cinemaId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if cinema object is successfully deleted", async () => {
            await Utils.sendRequest("/cinema/delete/1", 200, "DELETE");
            await Utils.sendRequest("/cinema/delete/2", 200, "DELETE");
            await Utils.sendRequest("/cinema/delete/3", 200, "DELETE");
            response = await Utils.sendRequest("/cinema/delete/4", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.CINEMA_MSG_DEL});
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            response = await Utils.sendRequest("/cinema/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID });

            response = await Utils.sendRequest("/cinema/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID });

            response = await Utils.sendRequest("/cinema/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/cinema/delete/5", 404, "DELETE"); 
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Now that there are no cinema records in the database, fetching it can be tested for 404 Not Found status
    // At the end of the step no cinema objects are in the database
    //---------------------------------

    describe("GET (404) /cinema/all", async () => {
        it("should respond with 404 if no cinema objects are found in the database", async () => {
            response = await Utils.sendRequest("/cinema/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND_ALL, cinemas: [] });
        });
    });
});