import * as Constants from './constants.ts';

//---------------------------------
// Cinema
//---------------------------------
export const CINEMA_ERR_EMPTY_ARGS: string = "Cinema name, address and both coordinates are all required";
export const CINEMA_ERR_ID: string = "Cinema ID should be a positive integer";
export const CINEMA_ERR_TYPING: string = "Cinema name, address and both coordinates should have correct typings (string, string, number and number respectively)";
export const CINEMA_ERR_NAME_LEN: string = `Cinema name length is incorrect (it should be between ${Constants.CINEMA_NAME_MIN_LEN} and ${Constants.CINEMA_NAME_MAX_LEN})`;
export const CINEMA_ERR_ADDRESS: string = "Cinema address does not match the specified format (look into the documentation)";
export const CINEMA_ERR_LATITUDE_VAL: string = `Cinema latitude must be between ${Constants.CINEMA_MIN_LATITUDE} and ${Constants.CINEMA_MAX_LATITUDE} (degrees)`;
export const CINEMA_ERR_LONGITUDE_VAL: string = `Cinema longitude must be between ${Constants.CINEMA_MIN_LONGITUDE} and ${Constants.CINEMA_MAX_LONGITUDE} (degrees)`;
export const CINEMA_ERR_NOT_FOUND_ALL: string = "No cinemas were found in the database";
export const CINEMA_ERR_NOT_FOUND: string = "Cinema with specified ID was not found in the database";
export const CINEMA_MSG_DEL: string = "Cinema deleted successfully";

//---------------------------------
// Room
//---------------------------------
export const ROOM_ERR_EMPTY_ARGS: string = "Room name, chair placement and corresponding cinema id are all required";
export const ROOM_ERR_ID: string = "Room ID should be a positive integer";
export const ROOM_ERR_TYPING: string = "Room name, chair placement and corresponding cinema id should have correct typings (string, string and integer respectively)";
export const ROOM_ERR_NAME_LEN: string = `Room name length is incorrect (it should be between ${Constants.ROOM_NAME_MIN_LEN} and ${Constants.ROOM_NAME_MAX_LEN})`;
export const ROOM_ERR_LAYOUT: string = "Room layout does not match the specified format (look into the documentation)";
export const ROOM_ERR_NOT_FOUND_ALL: string = "No rooms were found in the database";
export const ROOM_ERR_NOT_FOUND: string = "No rooms were found in the specified cinema";
export const ROOM_ERR_NOT_FOUND_GLOBAL: string = "Room with specified ID was not found in the database";
export const ROOM_MSG_DEL: string = "Room deleted successfully";

//---------------------------------
// Screening
//---------------------------------
export const SCREENING_ERR_EMPTY_ARGS: string = "Screening name and corresponding room id and movie id are all required";
export const SCREENING_ERR_ID: string = "Screening ID should be a positive integer";
export const SCREENING_ERR_TYPING: string = "Screening name and corresponding room id and movie id should have correct typings (string, integer and integer respectively)";
export const SCREENING_ERR_START_DATE: string = `Screening start date is an invalid date`;
export const SCREENING_ERR_NOT_FOUND_ALL: string = "No screenings were found in the database";
export const SCREENING_ERR_NOT_FOUND_ROOM: string = "No screenings connected with the specified room were found";
export const SCREENING_ERR_NOT_FOUND_MOVIE: string = "No screenings connected with the specified movie were found";
export const SCREENING_ERR_NOT_FOUND_GLOBAL: string = "Screening with specified ID was not found in the database";
export const SCREENING_MSG_DEL: string = "Screening deleted successfully";

//---------------------------------
// Movie
//---------------------------------
export const MOVIE_ERR_EMPTY_ARGS: string = "Movie arguments are all required";
export const MOVIE_ERR_ID: string = "Movie ID should be a positive integer";
export const MOVIE_ERR_TYPING: string = "Movie title, viewing format, duration, description, poster and trailer url, language, premiere date, genre, restrictions, cast and director should have correct typings (all should be of type string besides viewing format, which should be an integer)";
export const MOVIE_ERR_TITLE_LEN: string = `Movie title length is incorrect (it should be between ${Constants.MOVIE_TITLE_MIN_LEN} and ${Constants.MOVIE_TITLE_MAX_LEN})`;
export const MOVIE_ERR_VIEWING_FORMAT: string = `All movie formats should be one of the following: ${Constants.MOVIE_STD_VIEWING_FORMATS.join(", ")}`;
export const MOVIE_ERR_DURATION: string = `Movie durations is incorrect (it should be between ${Constants.MOVIE_DUR_MIN} and ${Constants.MOVIE_DUR_MAX})`;
export const MOVIE_ERR_DESC: string = `Movie description length is incorrect (it should be between ${Constants.MOVIE_DESC_MIN_LEN} and ${Constants.MOVIE_DESC_MAX_LEN})`;
export const MOVIE_ERR_POSTER_URL: string = `Movie poster URL should be a valid URL`;
export const MOVIE_ERR_TRAILER_URL: string = `Movie trailer URL should be a valid URL`;
export const MOVIE_ERR_LANG_LEN: string = `Movie language length is incorrect (it should be between ${Constants.MOVIE_LANG_MIN_LEN} and ${Constants.MOVIE_LANG_MAX_LEN})`;
export const MOVIE_ERR_PREMIERE_DATE: string = `Movie premiere date is an invalid date`;
export const MOVIE_ERR_GENRE_LEN: string = `Movie genre length is incorrect (it should be between ${Constants.MOVIE_GENRE_MIN_LEN} and ${Constants.MOVIE_GENRE_MAX_LEN})`;
export const MOVIE_ERR_CAST_LEN: string = `Movie cast length is incorrect (it should be between ${Constants.MOVIE_CAST_MIN_LEN} and ${Constants.MOVIE_CAST_MAX_LEN})`;
export const MOVIE_ERR_DIR_LEN: string = `Movie director length is incorrect (it should be between ${Constants.MOVIE_DIR_MIN_LEN} and ${Constants.MOVIE_DIR_MAX_LEN})`;
export const MOVIE_ERR_NOT_FOUND_ALL: string = "No movies were found in the database";
export const MOVIE_ERR_NOT_FOUND: string = "Movie with specified ID was not found in the database";
export const MOVIE_MSG_DEL: string = "Movie deleted successfully";