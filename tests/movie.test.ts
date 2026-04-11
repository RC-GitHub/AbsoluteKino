import sequelize from "../src/models";
import * as Messages from "../src/messages";
import * as Constants from "../src/constants";
import * as Utils from "./utils";

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe("Movie Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // First movie object is created successfully
    // Then tests go over all cases which result in failure
    // At the end of the step only 1 movie object is in the database
    //---------------------------------

    describe("POST /movie/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created movie object", async () => {
            response = await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData);
            expect(response.body).toHaveProperty("movies");
            expect(response.body.movies[0]).toHaveProperty("title", Utils.movieData.title);
            expect(response.body.movies[0]).toHaveProperty("duration", Utils.movieData.duration);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // title: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, title: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, title: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // viewingFormat: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, viewingFormat: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, viewingFormat: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // duration: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, duration: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, duration: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // description: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // posterUrl: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, posterUrl: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, posterUrl: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // trailerUrl: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, trailerUrl: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, trailerUrl: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // language: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // premiereDate: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, premiereDate: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, premiereDate: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // genre: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // restrictions: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, restrictions: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, restrictions: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // cast: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // director: undefined or null
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: undefined });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // All are undefined/empty object
            response = await Utils.sendRequest("/movie/new", 400, "POST", {});
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // title: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, title: 123 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // viewingFormat: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, viewingFormat: true });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // duration: not a number
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, duration: "120" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // description: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: ["description"] });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // posterUrl: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, posterUrl: 500 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // trailerUrl: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, trailerUrl: { url: "http://test.com" } });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // language: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: 1 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // premiereDate: not a valid date string/format
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, premiereDate: "not-a-date" });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // genre: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: false });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // restrictions: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, restrictions: 18 });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // cast: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: { lead: "Actor" } });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });

            // director: not a string
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: ["Director Name"] });
            expect(response.body).toEqual({ message: Messages.ROOM_ERR_TYPING, movies: [] });
        });

        it("should respond with 400 if title length is invalid", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, title: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, title: "   " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });
        });

        it("should respond with 400 if viewingFormat is invalid", async () => {
            // format not in MOVIE_STD_VIEWING_FORMATS
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, viewingFormat: "INVALID_FORMAT" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_VIEWING_FORMAT, movies: [] });
            
            // one is invalid
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, viewingFormat: "IMAX INVALID" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_VIEWING_FORMAT, movies: [] });
        });

        it("should respond with 400 if duration is out of range", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, duration: Constants.MOVIE_DUR_MIN - 1 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DURATION, movies: [] });

            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, duration: Constants.MOVIE_DUR_MAX + 1 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DURATION, movies: [] });
        });

        it("should respond with 400 if description length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: " " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, description: "a".repeat(Constants.MOVIE_DESC_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });
        });

        it("should respond with 400 if poster url is invalid", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, posterUrl: "ftp://wrong-protocol.com" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
            
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, posterUrl: "just_string" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
        });

        it("should respond with 400 if trailer url is invalid", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, trailerUrl: "ftp://wrong-protocol.com" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
            
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, trailerUrl: "just_string" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
        });

        it("should respond with 400 if language length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: "" }); 
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: "  " }); 
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, language: "a".repeat(Constants.MOVIE_LANG_MAX_LEN + 1) }); 
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });
        });

        it("should respond with 400 if premiere date is invalid", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, premiereDate: "2000-02-30T00:00:00.000Z" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
        });

        it("should respond with 400 if genre length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, genre: "a".repeat(Constants.MOVIE_GENRE_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });
        });

        it("should respond with 400 if restrictions value is not in Enum", async () => {
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, restrictions: "Unrated" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_RESTRICTIONS, movies: [] });
        });

        it("should respond with 400 if cast length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, cast: "a".repeat(Constants.MOVIE_CAST_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });
        });

        it("should respond with 400 if director length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/new", 400, "POST", { ...Utils.movieData, director: "a".repeat(Constants.MOVIE_DIR_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // 3 further movie objects are created and then fetched
    // After that movie object with id 3 is being fetched
    // At the end of the step only 4 movie objects are in the database
    //---------------------------------

    describe("GET /movie/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all movie objects", async () => {
            await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData);
            await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData);
            await Utils.sendRequest("/movie/new", 200, "POST", Utils.movieData);

            response = await Utils.sendRequest("/movie/all", 200, "GET");
            expect(response.body.movies).toBeInstanceOf(Array);
            expect(response.body.movies).toHaveLength(4);
        });
    });

    describe("GET /movie/id/:movieId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the found movie", async () => {
            response = await Utils.sendRequest("/movie/id/3", 200, "GET");
            expect(response.body.movies).toHaveLength(1);
            expect(response.body.movies[0]).toHaveProperty("id", 3);
        });

        it("should respond with 400 if movieId is invalid", async () => {
            response = await Utils.sendRequest("/movie/id/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });

            response = await Utils.sendRequest("/movie/id/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });

            response = await Utils.sendRequest("/movie/id/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });
        });

        it("should respond with 404 if movie object is not found in the database", async () => {
            response = await Utils.sendRequest("/movie/id/5", 404, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND, movies: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // First movie object is modified successfully
    // Then tests go over all cases which result in update failure
    // At the end of the step only 4 movie objects are in the database
    //---------------------------------

    describe("PUT /movie/update/:movieId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and modified data", async () => {
            const updatedData = { title: "Updated Movie Title" };
            response = await Utils.sendRequest("/movie/update/1", 200, "PUT", updatedData);
            expect(response.body.movies[0]).toHaveProperty("title", updatedData.title);
        });

        it("should respond with 400 if all update fields are missing", async () => {
            // all are undefined
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // mixed invalid
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { title: null, duration: null });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });

            // all are null
            const invalidMovieData = {
                title: null,
                viewingFormat: null,
                duration: null,
                description: null,
                posterUrl: null,
                trailerUrl: null,
                language: null,
                premiereDate: null,
                genre: null,
                restrictions: null,
                cast: null,
                director: null
            }
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", invalidMovieData);
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
        });

        it("should respond with 400 if update types are incorrect", async () => {
            // title: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { title: 123 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // viewingFormat: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { viewingFormat: true });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // duration: not a number
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { duration: "120" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // description: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { description: ["array"] });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // posterUrl: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { posterUrl: 500 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // trailerUrl: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { trailerUrl: { url: 2 } });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // language: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { language: 1 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // premiereDate: not a valid date/string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { premiereDate: {} });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // genre: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { genre: false });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // restrictions: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { restrictions: 18 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // cast: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { cast: 2 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });

            // director: not a string
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { director: ["Name"] });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
        });

        it("should respond with 400 if updated title length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { title: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { title: "   " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });

            // too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { title: "a".repeat(Constants.MOVIE_TITLE_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });
        });

        it("should respond with 400 if updated viewingFormat is invalid", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { viewingFormat: "4K_ULTRA_FAKE" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_VIEWING_FORMAT, movies: [] });
        });

        it("should respond with 400 if updated duration is out of range", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { duration: Constants.MOVIE_DUR_MIN - 1 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DURATION, movies: [] });

            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { duration: Constants.MOVIE_DUR_MAX + 1 });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DURATION, movies: [] });
        });

        it("should respond with 400 if updated description length is invalid", async () => {
            // Too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { description: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { description: " " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });

            // Too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { description: "a".repeat(Constants.MOVIE_DESC_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DESC, movies: [] });
        });

        it("should respond with 400 if updated poster url is invalid", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { posterUrl: "ftp://wrong-protocol.com" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
            
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { posterUrl: "just_string" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
        });

        it("should respond with 400 if updated trailer url is invalid", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { trailerUrl: "ftp://wrong-protocol.com" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
            
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { trailerUrl: "just_string" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
        });

        it("should respond with 400 if updated language length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { language: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { language: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });

            // too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { language: "a".repeat(Constants.MOVIE_LANG_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });
        });

        it("should respond with 400 if updated premiere date is invalid", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { premiereDate: "2000-02-30T00:00:00.000Z" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
        });

        it("should respond with 400 if updated genre length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { genre: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { genre: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });

            // too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { genre: "a".repeat(Constants.MOVIE_GENRE_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });
        });

        it("should respond with 400 if updated restrictions value is not in Enum", async () => {
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { restrictions: "21+" }); 
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_RESTRICTIONS, movies: [] });
        });

        it("should respond with 400 if updated cast length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { cast: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { cast: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });

            // too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { cast: "a".repeat(Constants.MOVIE_CAST_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });
        });

        it("should respond with 400 if updated director length is invalid", async () => {
            // too short
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { director: "" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });

            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { director: "  " });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });

            // too long
            response = await Utils.sendRequest("/movie/update/1", 400, "PUT", { director: "a".repeat(Constants.MOVIE_DIR_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });
        });

        it("should respond with 400 if movieId is invalid", async () => {
            response = await Utils.sendRequest("/movie/update/abc", 400, "PUT", { title: "Updated Movie Title" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });

            response = await Utils.sendRequest("/movie/update/0", 400, "PUT", { title: "Updated Movie Title" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });

            response = await Utils.sendRequest("/movie/update/-1", 400, "PUT", { title: "Updated Movie Title" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID, movies: [] });
        });

        it("should respond with 404 if specified movie is not found", async () => {
            response = await Utils.sendRequest("/movie/update/5", 404, "PUT", { title: "Ghost Movie" });
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND, movies: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All movie objects are being deleted one by one
    // At the end of the step no movie objects are in the database
    //---------------------------------

    describe("DELETE /movie/delete/:movieId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 if movie is deleted", async () => {
            await Utils.sendRequest("/movie/delete/1", 200, "DELETE");
            await Utils.sendRequest("/movie/delete/2", 200, "DELETE");
            await Utils.sendRequest("/movie/delete/3", 200, "DELETE");
            response = await Utils.sendRequest("/movie/delete/4", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.MOVIE_MSG_DEL });
        });

        it("should respond with 400 if movieId is invalid", async () => {
            response = await Utils.sendRequest("/movie/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_ID });
        });

        it("should respond with 404 if movie object is not found in the database", async () => {
            response = await Utils.sendRequest("/movie/delete/1", 404, "DELETE");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Database is empty, fetching all should 404
    //---------------------------------

    describe("GET (404) /movie/all", async () => {
        it("should respond with 404 if no movies exist", async () => {
            response = await Utils.sendRequest("/movie/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.MOVIE_ERR_NOT_FOUND_ALL, movies: [] });
        });
    });
});