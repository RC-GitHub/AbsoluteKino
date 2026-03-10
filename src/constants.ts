//---------------------------------
// Typical Values
//---------------------------------
export const TYPICAL_NAME_MIN_LENGTH: Number = 1;
export const TYPICAL_NAME_MAX_LENGTH: Number = 64;

export const TYPICAL_MIN_LATITUDE: Number = -90;
export const TYPICAL_MAX_LATITUDE: Number = 90;

export const TYPICAL_MIN_LONGITUDE: Number = -180;
export const TYPICAL_MAX_LONGITUDE: Number = 180;

//---------------------------------
// Cinema
//---------------------------------
export const CINEMA_NAME_MIN_LENGTH: Number = TYPICAL_NAME_MIN_LENGTH;
export const CINEMA_NAME_MAX_LENGTH: Number = TYPICAL_NAME_MAX_LENGTH;

export const CINEMA_POLISH_ADDRESS_REGEX: RegExp = /^((al\.|ul\.|pl\.|sq\.|os\.|ryn\.|dz\.|tr\.){1} )?[\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]+ (\d{1,4})([a-z])?([\/]\d{1,3})?(, \d{2}-\d{3} [\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)?(, [a-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)*$/gm

export const CINEMA_MIN_LATITUDE: Number = TYPICAL_MIN_LATITUDE;
export const CINEMA_MAX_LATITUDE: Number = TYPICAL_MAX_LATITUDE;

export const CINEMA_MIN_LONGITUDE: Number = TYPICAL_MIN_LONGITUDE;
export const CINEMA_MAX_LONGITUDE: Number = TYPICAL_MAX_LONGITUDE;