//---------------------------------
// Typical Values
//---------------------------------
export const TYPICAL_MIN_ID: number = 1;

export const TYPICAL_NAME_MIN_LENGTH: number = 1;
export const TYPICAL_NAME_MAX_LENGTH: number = 64;

export const TYPICAL_MIN_LATITUDE: number = -90;
export const TYPICAL_MAX_LATITUDE: number = 90;

export const TYPICAL_MIN_LONGITUDE: number = -180;
export const TYPICAL_MAX_LONGITUDE: number = 180;

//---------------------------------
// Cinema
//---------------------------------
export const CINEMA_NAME_MIN_LENGTH: number = TYPICAL_NAME_MIN_LENGTH;
export const CINEMA_NAME_MAX_LENGTH: number = TYPICAL_NAME_MAX_LENGTH;

export const CINEMA_POLISH_ADDRESS_REGEX: RegExp = /^((al\.|ul\.|pl\.|sq\.|os\.|ryn\.|dz\.|tr\.){1} )?[\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]+ (\d{1,4})([a-z])?([\/]\d{1,3})?(, \d{2}-\d{3} [\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)?(, [a-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)*$/gm

export const CINEMA_MIN_LATITUDE: number = TYPICAL_MIN_LATITUDE;
export const CINEMA_MAX_LATITUDE: number = TYPICAL_MAX_LATITUDE;

export const CINEMA_MIN_LONGITUDE: number = TYPICAL_MIN_LONGITUDE;
export const CINEMA_MAX_LONGITUDE: number = TYPICAL_MAX_LONGITUDE;

//---------------------------------
// Room
//---------------------------------
export const ROOM_NAME_MIN_LENGTH: number = 3;
export const ROOM_NAME_MAX_LENGTH: number = 20;

export const ROOM_LAYOUT_REGEX: RegExp = /^([A-I]\d{1,3}(, [A-I]\d{1,3})*(;[ \t]?|$))+$/;