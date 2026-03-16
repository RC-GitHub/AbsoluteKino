//---------------------------------
// Typical Values
//---------------------------------
export const TYPICAL_MIN_ID: number = 1;

export const TYPICAL_NAME_MIN_LEN: number = 1;
export const TYPICAL_NAME_MAX_LEN: number = 64;

export const TYPICAL_MIN_LATITUDE: number = -90;
export const TYPICAL_MAX_LATITUDE: number = 90;

export const TYPICAL_MIN_LONGITUDE: number = -180;
export const TYPICAL_MAX_LONGITUDE: number = 180;

//---------------------------------
// Cinema
//---------------------------------
export const CINEMA_NAME_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const CINEMA_NAME_MAX_LEN: number = TYPICAL_NAME_MAX_LEN;

export const CINEMA_POLISH_ADDRESS_REGEX: RegExp = /^((al\.|ul\.|pl\.|sq\.|os\.|ryn\.|dz\.|tr\.){1} )?[\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]+ (\d{1,4})([a-z])?([\/]\d{1,3})?(, \d{2}-\d{3} [\da-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)?(, [a-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ -]*)*$/gm

export const CINEMA_MIN_LATITUDE: number = TYPICAL_MIN_LATITUDE;
export const CINEMA_MAX_LATITUDE: number = TYPICAL_MAX_LATITUDE;

export const CINEMA_MIN_LONGITUDE: number = TYPICAL_MIN_LONGITUDE;
export const CINEMA_MAX_LONGITUDE: number = TYPICAL_MAX_LONGITUDE;

//---------------------------------
// Room
//---------------------------------
export const ROOM_NAME_MIN_LEN: number = 3;
export const ROOM_NAME_MAX_LEN: number = TYPICAL_NAME_MAX_LEN / 2;

export const ROOM_LAYOUT_REGEX: RegExp = /^([A-I]\d{1,3}(, [A-I]\d{1,3})*(;[ \t]?|$))+$/;

//---------------------------------
// Movie
//---------------------------------
export const MOVIE_NAME_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_NAME_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 2;

export const MOVIE_DUR_MIN_LEN: number = 1;
export const MOVIE_DUR_MAX_LEN: number = 857 * 60; // The duration of the longest movie in the world, i.e. 'Logistics' (2012)

export const MOVIE_DESC_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_DESC_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 16;

export const MOVIE_STD_VIEWING_FORMATS = ['2D', '3D', 'HD', 'FHD', '4K', '4D', 'IMAX', 'IMAX 3D', '4DX', 'ScreenX', '70mm', 'VIP'];
export const MOVIE_AGE_RESTRICTIONS = ['BO', '7+', '12+', '15+', '18+'] as const;