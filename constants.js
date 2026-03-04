export const TYPICAL_NAME_MIN_LENGTH = 1;
export const TYPICAL_NAME_MAX_LENGTH = 64;

// Cinema
export const CINEMA_NAME_MIN_LENGTH = TYPICAL_NAME_MAX_LENGTH;
export const CINEMA_NAME_MAX_LENGTH = TYPICAL_NAME_MAX_LENGTH;
export const CINEMA_ADDRESS_REGEX = /^((a-z.)+ [^\d!@#$%^&*()_+=\[\]{};':"\\|,<>?\/]+ \d{1,4}[a-z]?|\d{1,4}[a-z]? [^\d!@#$%^&*()_+=\[\]{};':"\\|,<>?\/]+ (a-z.)+)+(, [^!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/]+)*$/i;