import { CONFIG } from './config.ts';
import * as Constants from './constants.ts';

//---------------------------------
// App
//---------------------------------
export const APP_WELCOME: string = "Welcome to AbsoluteKino!";
export const APP_LISTENING: string = `AbsoluteKino listening on port ${CONFIG.PORT}`;

export const APP_ERR_OWNER: string = "CRITICAL: Site Owner registration failed: ";
export const APP_ERR_OWNER_ELEVATE: string = "ERROR: Failed to elevate user to Site Admin status:";
export const APP_ERR_REVOKE: string = "ERROR: Failed to revoke Site Admin privileges:";
export const APP_ERR_UPDATE: string = "ERROR: Failed to update Site Admin data: ";
export const APP_ERR_DELETE: string = "ERROR: Failed to delete Site Admin: ";
export const APP_ERR_OWNER_LISTENING: string = "AbsoluteKino could not be started because the owner could not be created";
export const APP_ERR_INTERNAL: string = "An internal server error occurred during the administrative operation.";

//---------------------------------
// Database
//---------------------------------
export const DB_CONN: string = "Connection has been established successfully";
export const DB_SYNCED: string = "Database synced successfully";

export const DB_ERR_CONN: string = "Unable to connect to the database: ";
export const DB_ERR_SYNCING: string = "Failed to sync database: ";
export const DB_ERR_FETCHING: string = "Fetching error: ";
export const DB_ERR_INTERNAL: string = "Internal Server Error";
export const DB_ERR_ASSOCIATION: string = "Internal Association Error";

//---------------------------------
// Authentication
//---------------------------------
export const AUTH_REQUIRED: string = "Access denied: Authentication is required to complete this request";
export const AUTH_SESSION: string = "Session expired or invalid: Please log in again";
export const AUTH_FORBIDDEN: string = "Access denied: You do not have the required permissions for this action";

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
export const ROOM_ERR_EMPTY_ARGS: string = "Room name, width, depth, row amount, column amount and corresponding cinema id are all required";
export const ROOM_ERR_EMPTY_ARGS_EX: string = "Room name, width, depth, row amount, column amount, stairs placements and cinema id are all required";
export const ROOM_ERR_ID: string = "Room ID should be a positive integer";
export const ROOM_ERR_TYPING: string = "Room name, chair placement and corresponding cinema id should have correct typings (string, string and integer respectively)";
export const ROOM_ERR_NAME_LEN: string = `Room name length is incorrect (it should be between ${Constants.ROOM_NAME_MIN_LEN} and ${Constants.ROOM_NAME_MAX_LEN})`;
export const ROOM_ERR_WIDTH: string = `Room width is incorrect (it should be between ${Constants.ROOM_WIDTH_MIN_VAL} and ${Constants.ROOM_WIDTH_MAX_VAL})`;
export const ROOM_ERR_DEPTH: string = `Room depth is incorrect (it should be between ${Constants.ROOM_DEPTH_MIN_VAL} and ${Constants.ROOM_DEPTH_MAX_VAL})`;
export const ROOM_ERR_ROWS: string = `Room row amount is incorrect (it should be between ${Constants.ROOM_ROWS_MIN_VAL} and ${Constants.ROOM_ROWS_MAX_VAL})`;
export const ROOM_ERR_COLS: string = `Room col amount is incorrect (it should be between ${Constants.ROOM_COLS_MIN_VAL} and ${Constants.ROOM_COLS_MAX_VAL})`;
export const ROOM_ERR_STAIRS: string = `Room stairs positions should be a non-empty array of objects containing positive integer 'x's and a 'widths' between ${Constants.ROOM_STAIRS_MIN_VAL} and ${Constants.ROOM_STAIRS_MAX_VAL}`;
export const ROOM_ERR_EXCEED: string = `Seating layout exceeds room dimensions. Adjust room size or seat counts`;
export const ROOM_ERR_NOT_FOUND_ALL: string = "No rooms were found in the database";
export const ROOM_ERR_NOT_FOUND: string = "No rooms were found in the specified cinema";
export const ROOM_ERR_NOT_FOUND_GLOBAL: string = "Room with specified ID was not found in the database";
export const ROOM_MSG_DEL: string = "Room deleted successfully";

//---------------------------------
// Seat
//---------------------------------
export const SEAT_ERR_EMPTY_ARGS: string = "Seat x coordinate, y coordinate, row, column, type and room Id are all required";
export const SEAT_ERR_ID: string = "Seat ID should be a positive integer";
export const SEAT_ERR_TYPING: string = "Seat x coordinate, y coordinate, row, column, type and room Id should have correct typings (integer, integer, integer, integer, string and integer respectively)";
export const SEAT_ERR_X_VAL: string = `Seat x coordinate should be a positive integer`;
export const SEAT_ERR_X_INVALID: string = `Seat x coordinate is outside of Room's bounds`;
export const SEAT_ERR_Y_VAL: string = `Seat y coordinate should be a positive integer`;
export const SEAT_ERR_Y_INVALID: string = `Seat y coordinate is outside of Room's bounds`;
export const SEAT_ERR_WIDTH_VAL: string = `Seat width must be between ${Constants.SEAT_WIDTH_MIN_VAL} and ${Constants.SEAT_WIDTH_MAX_VAL}`;
export const SEAT_ERR_DEPTH_VAL: string = `Seat depth must be between ${Constants.SEAT_DEPTH_MIN_VAL} and ${Constants.SEAT_DEPTH_MAX_VAL}`;
export const SEAT_ERR_ROW_VAL: string = `Seat row must be between ${Constants.ROOM_ROWS_MIN_VAL} and ${Constants.ROOM_ROWS_MAX_VAL}`;
export const SEAT_ERR_ROW_INVALID: string = `Seat row is outside of Room's allowed row amount`;
export const SEAT_ERR_COL_VAL: string = `Seat column must be between ${Constants.ROOM_COLS_MIN_VAL} and ${Constants.ROOM_COLS_MAX_VAL}`;
export const SEAT_ERR_COL_INVALID: string = `Seat column is outside of Room's allowed column amount`;
export const SEAT_ERR_TYPE: string = `Seat type should be one of the following: ${Constants.SEAT_TYPES.join(", ")}`;
export const SEAT_ERR_OCCUPIED: string = "This seat is currently occupied for this screening";
export const SEAT_ERR_RESERVED: string = "This seat is already reserved for this screening";
export const SEAT_ERR_NOT_FOUND_ALL: string = "No seats were found in the database";
export const SEAT_ERR_NOT_FOUND_ROOM: string = "No seats were found for the specified room";
export const SEAT_ERR_NOT_FOUND: string = "Seat with specified ID was not found in the database";
export const SEAT_MSG_DEL: string = "Reservation cancelled successfully";

//---------------------------------
// Screening
//---------------------------------
export const SCREENING_ERR_EMPTY_ARGS: string = "Screening name and corresponding room id and movie id are all required";
export const SCREENING_ERR_ID: string = "Screening ID should be a positive integer";
export const SCREENING_ERR_TYPING: string = "Screening start date and corresponding room id and movie id should have correct typings (string, integer and integer respectively)";
export const SCREENING_ERR_START_DATE: string = `Screening start date is an invalid date`;
export const SCREENING_ERR_PRICE: string = `Screening price cannot be lower than 0`;
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
export const MOVIE_ERR_RESTRICTIONS: string = `Movie restrictions do not match the specified format (look into the documentation)`;
export const MOVIE_ERR_CAST_LEN: string = `Movie cast length is incorrect (it should be between ${Constants.MOVIE_CAST_MIN_LEN} and ${Constants.MOVIE_CAST_MAX_LEN})`;
export const MOVIE_ERR_DIR_LEN: string = `Movie director length is incorrect (it should be between ${Constants.MOVIE_DIR_MIN_LEN} and ${Constants.MOVIE_DIR_MAX_LEN})`;
export const MOVIE_ERR_NOT_FOUND_ALL: string = "No movies were found in the database";
export const MOVIE_ERR_NOT_FOUND: string = "Movie with specified ID was not found in the database";
export const MOVIE_MSG_DEL: string = "Movie deleted successfully";

//---------------------------------
// User
//---------------------------------
export const USER_OWNER = "Site owner account has been initialized successfully.";
export const USER_OWNER_ELEVATE = "Account has been elevated to site owner successfully.";
export const USER_ERR_OWNER = "Failed to initialize site owner account";
export const USER_ERR_OWNER_MODIFY = "This account cannot be modified";
export const USER_ERR_OWNER_ELEVATE = "Failed to elevate the user to site owner";
export const USER_ERR_NOT_SITE_ADMIN = "Access Denied: The target user is not a Site Admin.";
export const USER_MSG_REVOKE = "Site Admin privileges have been successfully revoked.";
export const USER_MSG_UPDATE_SUCCESS = "Site Admin profile updated successfully.";
export const USER_MSG_DEL_SUCCESS = "Site Admin user deleted successfully.";

export const USER_MSG_LOGIN = "User successfully logged in";
export const USER_MSG_LOGOUT = "User successfully logged out";
export const USER_ERR_TOKEN = "User version should be a positive integer"
export const USER_ERR_ALREADY_LOGGED_IN = "You are already logged in. Please log out first to switch accounts.";
export const USER_ERR_LOGIN = "Invalid login/email/phone number or password";

export const USER_ERR_EMPTY_ARGS: string = "Necessary user arguments are all required";
export const USER_ERR_ID: string = "User ID should be a positive integer";
export const USER_ERR_TYPING: string = "User name, account type, password, email and phone number should have correct typings (string, string, string or null, string or null and string or null respectively)";
export const USER_ERR_NAME_LEN: string = `User name length is incorrect (it should be between ${Constants.USER_NAME_MIN_LEN} and ${Constants.USER_NAME_MAX_LEN})`;
export const USER_ERR_ACC_TYPE: string = `User account type should be one of the following: ${Constants.USER_ACC_TYPES.slice(0, -1).join(", ")}`;
export const USER_ERR_ACC_TYPE_CHANGE: string = `This user account type change is not allowed`;
export const USER_ERR_UNAUTHORIZED: string = `Unauthenticated user must provide email address and/or phone number`;
export const USER_ERR_PASS_LEN: string = `User password length is incorrect (it should be between ${Constants.USER_PASS_MIN_LEN} and ${Constants.USER_PASS_MAX_LEN})`;
export const USER_ERR_EMAIL: string = `User email should adhere to the standard email format as provided by Sequelize`;
export const USER_ERR_EMAIL_UNIQUE: string = `User with this email already exists`;
export const USER_ERR_PHONE: string = `User phone number does not match the specified format (look into the documentation)`;
export const USER_ERR_PHONE_UNIQUE: string = `User with this phone number already exists`;
export const USER_MSG_CINEMA_ASSIGN = "Cinema Admin successfully assigned to cinema.";

export const USER_ERR_DEL_SITE: string = `This user cannot be deleted using this method`
export const USER_ERR_NOT_FOUND_ALL: string = "No users were found in the database";
export const USER_ERR_NOT_FOUND: string = "User with specified ID was not found in the database";
export const USER_MSG_DEL: string = "User deleted successfully";

//---------------------------------
// Reservation
//---------------------------------
export const RESERVATION_ERR_EMPTY_ARGS: string = "Reservation row, column, reservation date, screening ID and user ID are all required";
export const RESERVATION_ERR_ID: string = "Reservation ID should be a positive integer";
export const RESERVATION_ERR_TYPING: string = "Reservation row, column,  screening ID and user ID should have correct typings (integer, integer, integer and integer respectively)";
export const RESERVATION_ERR_DATE: string = "Reservation date is an invalid date";
export const RESERVATION_ERR_DATE_EXPIRED: string = "Reservation cannot be made after the screening start date";
export const RESERVATION_ERR_PAYMENT: string = "Reservation payment amount is invalid";
export const RESERVATION_ERR_TYPE: string = `Reservation type should be one of the following: ${Constants.RESERVATION_TYPES.join(", ")}`;
export const RESERVATION_ERR_BLOCKED: string = "Reservation is temporarily blocked as someone is undergoing a transaction containing one of the chosen seats";
export const RESERVATION_ERR_RESERVED: string = "Reservation cannot be completed as one of the chosen seats is already reserved";
export const RESERVATION_ERR_COMPLETED: string = "Reservation completed successfully";
export const RESERVATION_ERR_NOT_FOUND_ALL: string = "No reservations were found in the database";
export const RESERVATION_ERR_NOT_FOUND_SEAT: string = "No reservations were found for the specified seat";
export const RESERVATION_ERR_NOT_FOUND_USER: string = "No reservations were found for the specified user";
export const RESERVATION_ERR_NOT_FOUND_SCREENING: string = "No reservations were found for the specified screening";
export const RESERVATION_ERR_NOT_FOUND: string = "Reservation with specified ID was not found in the database";
export const RESERVATION_MSG_DEL: string = "Reservation cancelled successfully";

//---------------------------------
// Product
//---------------------------------
export const PRODUCT_ERR_EMPTY_ARGS: string = "Product name, price, size, and cinema ID are all required";
export const PRODUCT_ERR_ID: string = "Product ID should be a positive integer";
export const PRODUCT_ERR_TYPING: string = "Product name, size, price, and discount should have correct typings (string, string, number, and number respectively)";
export const PRODUCT_ERR_NAME_LEN: string = `Product name length is incorrect (it should be between ${Constants.PRODUCT_NAME_MIN_LEN} and ${Constants.PRODUCT_NAME_MAX_LEN})`;
export const PRODUCT_ERR_PRICE: string = "Product price must be a positive decimal value";
export const PRODUCT_ERR_SIZE: string = `Product size must be one of the following: ${Constants.PRODUCT_SIZES.join(", ")}`;
export const PRODUCT_ERR_DISCOUNT: string = `Product discount must be a percentage between ${Constants.PRODUCT_DISCOUNT_MIN_VAL} and ${Constants.PRODUCT_DISCOUNT_MAX_VAL}`;
export const PRODUCT_ERR_NOT_FOUND_ALL: string = "No products were found in the database";
export const PRODUCT_ERR_NOT_FOUND: string = "Product with specified ID was not found in the database";
export const PRODUCT_ERR_NOT_FOUND_CINEMA: string = "No products were found for the specified cinema";
export const PRODUCT_MSG_DEL: string = "Product deleted successfully";
