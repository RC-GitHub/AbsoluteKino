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
export const MOVIE_TITLE_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_TITLE_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 2;

export const MOVIE_STD_VIEWING_FORMATS = ['2D', '3D', 'HD', 'FHD', '4K', '4D', 'IMAX', 'IMAX 3D', '4DX', 'ScreenX', '70mm', 'VIP'];
export const MOVIE_AGE_RESTRICTIONS = ['BO', '7+', '12+', '15+', '16+', '18+'] as const;

export const MOVIE_DUR_MIN: number = 1;
export const MOVIE_DUR_MAX: number = 857 * 60; // The duration of the longest movie in the world, i.e. 'Logistics' (2012)

export const MOVIE_DESC_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_DESC_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 16;

export const MOVIE_LANG_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_LANG_MAX_LEN: number = TYPICAL_NAME_MAX_LEN;

export const MOVIE_GENRE_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_GENRE_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 6;

export const MOVIE_CAST_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_CAST_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 12;

export const MOVIE_DIR_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const MOVIE_DIR_MAX_LEN: number = TYPICAL_NAME_MAX_LEN * 2;

//---------------------------------
// Screening
//---------------------------------
export const SCREENING_BASE_SEAT_PRICE: number = 26.00;

//---------------------------------
// User
//---------------------------------
export const USER_NAME_MIN_LEN: number = TYPICAL_NAME_MIN_LEN;
export const USER_NAME_MAX_LEN: number = TYPICAL_NAME_MAX_LEN;

export const USER_ACC_TYPES = ['Unauthenticated customer', 'Authenticated customer', 'Cinema admin', 'Site admin'] as const;

export const USER_PASS_MIN_LEN: number = 12;
export const USER_PASS_MAX_LEN: number = 72;
export const USER_PASS_SALT_ROUNDS: number = 10;

export const USER_EMAIL_REGEX: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const USER_PHONE_REGEX: RegExp = /^[1-9]\d{6,14}$/;

//---------------------------------
// Reservation
//---------------------------------
export const RESERVATION_MIN_ROW_VAL: number = 1;
export const RESERVATION_MAX_ROW_VAL: number = 32;

export const RESERVATION_MIN_COL_VAL: number = 1;
export const RESERVATION_MAX_COL_VAL: number = 32;