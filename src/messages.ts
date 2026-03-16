import * as Constants from './constants.ts';

//---------------------------------
// Cinema
//---------------------------------
export const CINEMA_ERR_EMPTY_ARGS: string = "Cinema name, address and both coordinates are all required";
export const CINEMA_ERR_ID: string = "Cinema ID should be a positive integer";
export const CINEMA_ERR_TYPING: string = "Cinema name, address and both coordinates should have correct typings (string, string, number and number respectively)";
export const CINEMA_ERR_NAME_LEN: string = `Cinema name length is incorrect (it should be between ${Constants.CINEMA_NAME_MIN_LENGTH} and ${Constants.CINEMA_NAME_MAX_LENGTH})`;
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
export const ROOM_ERR_NAME_LEN: string = `Room name length is incorrect (it should be between ${Constants.ROOM_NAME_MIN_LENGTH} and ${Constants.ROOM_NAME_MAX_LENGTH})`;
export const ROOM_ERR_LAYOUT: string = "Room layout does not match the specified format (look into the documentation)";
export const ROOM_ERR_NOT_FOUND_ALL: string = "No rooms were found in the database";
export const ROOM_ERR_NOT_FOUND: string = "No rooms were found in the specified cinema";
export const ROOM_ERR_NOT_FOUND_GLOBAL: string = "Room with specified ID was not found in the database";
export const ROOM_MSG_DEL: string = "Room deleted successfully";