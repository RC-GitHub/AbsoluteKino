import { Sequelize, Optional, DataTypes, InferAttributes, InferCreationAttributes, Model, Dialect } from "sequelize";

import { CONFIG } from './config';
import * as Constants from "./constants";
import * as Messages from "./messages";

const isSqlite = CONFIG.DB.DIALECT === 'sqlite';
const isTest = CONFIG.NODE_ENV === 'test';

const sequelize: Sequelize = new Sequelize({
    dialect: CONFIG.DB.DIALECT as Dialect,
    storage: isSqlite ? (isTest ? CONFIG.DB.TEST_STORAGE : CONFIG.DB.STORAGE) : undefined,

    host: !isSqlite ? CONFIG.DB.HOST : undefined,
    port: !isSqlite ? CONFIG.DB.PORT : undefined,
    username: !isSqlite ? CONFIG.DB.USER : undefined,
    password: !isSqlite ? CONFIG.DB.PASSWORD : undefined,
    database: !isSqlite ? CONFIG.DB.NAME : undefined,

    logging: CONFIG.DB.LOGGING,
    define: {
        freezeTableName: true
    },
    dialectOptions: isSqlite ? { foreign_keys: true } : {}
});

try {
  async () => {
    await sequelize.authenticate();
    console.log(Messages.DB_CONN);
  }
} catch (error) {
  console.error(Messages.DB_ERR_CONN, error);
}

const commonAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
    validate: {
      isNumeric: true,
      min: Constants.TYPICAL_MIN_ID
    }
  },
};

//---------------------------------
// User
//---------------------------------

export interface UserAttributes {
  id?: number;
  name: string;
  accountType: string;
  password: string | null;
  email: string | null;
  phoneNumber: string | number | null;
  tokenVersion: number,
  createdAt: Date,
  updatedAt: Date,
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

export interface UserInstance extends Model<UserAttributes>, UserAttributes { }

export const User = sequelize.define<UserInstance, UserCreationAttributes>("User", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.USER_NAME_MIN_LEN, Constants.USER_NAME_MAX_LEN],
        msg: Messages.USER_ERR_NAME_LEN
      },
    }
  },
  accountType: {
    type: DataTypes.ENUM(...Constants.USER_ACC_TYPES),
    allowNull: false,
    defaultValue: Constants.USER_ACC_TYPES[0]
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
      name: 'email',
      msg: Messages.USER_ERR_EMAIL_UNIQUE
    },
    validate: {
      isEmail: {
        msg: Messages.USER_ERR_EMAIL
      }
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
      name: 'phoneNumber',
      msg: Messages.USER_ERR_PHONE_UNIQUE
    },
    validate: {
      is: {
        args: Constants.USER_PHONE_REGEX,
        msg: Messages.USER_ERR_PHONE
      }
    },
  },

  tokenVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [Constants.USER_TOKEN_VER_MIN_VAL],
        msg: Messages.USER_ERR_TOKEN
      }
    },
    defaultValue: Constants.USER_TOKEN_VER_MIN_VAL
  }
},
{
  timestamps: true, 
  tableName: "User", 
});

//---------------------------------
// Cinema
//---------------------------------

export interface CinemaAttributes {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CinemaInstance extends Model<CinemaAttributes>, CinemaAttributes { }

export const Cinema = sequelize.define<CinemaInstance>("Cinema", {
  ...commonAttributes,

  // Accepts names that are between 1 and 64 characters long
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.CINEMA_NAME_MIN_LEN, Constants.CINEMA_NAME_MAX_LEN],
        msg: Messages.CINEMA_ERR_NAME_LEN
      }
    }
  },

  // Accepts addresses like:
  // - LOCATION_ABBREVIATION LOCATION_NAME LOCATION_NUMBER, LOCATION_POSTAL_CODE, LOCATION_DETAILING (multiple possible; all after a comma)
  // Where:
  // - LOCATION_ABBREVIATION accepts one of the following: (al.|ul.|pl.|sq.|os.|ryn.|dz.|tr.)
  // - LOCATION_NAME accepts any character in the Polish alphabet plus digits, spaces and dashes
  // - LOCATION_NUMBER accepts up to 4 digits and optional lowercase Latin alphabet letter as well as optional addition consisting of a slash character and up to 2 digits
  // - LOCATION_POSTAL_CODE accepts a sequence of 2 digits followed by a dash, then another 3 digits and a name consisting of Polish characters after a space
  // - LOCATION_DETAILING accepts any character in the Polish alphabet plus spaces and dashes after a comma and a space
  // Examples:
  // ul. Wielosławska 34b
  // Michajowice 12/90, Warszawa
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: Constants.CINEMA_POLISH_ADDRESS_REGEX,
        msg: Messages.CINEMA_ERR_ADDRESS
      }
    }
  },

  // Accepts latitudes between -90 and 90 (degrees)
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
        min: { args: [Constants.CINEMA_MIN_LATITUDE], msg: Messages.CINEMA_ERR_LATITUDE_VAL },
        max: { args: [Constants.CINEMA_MAX_LATITUDE], msg: Messages.CINEMA_ERR_LATITUDE_VAL }
    }
  },

  // Accepts longitudes between -180 and 180 (degrees)
  longitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: { args: [Constants.CINEMA_MIN_LONGITUDE], msg: Messages.CINEMA_ERR_LONGITUDE_VAL },
      max: { args: [Constants.CINEMA_MAX_LONGITUDE], msg: Messages.CINEMA_ERR_LONGITUDE_VAL }
    }
  },
});

export const UserCinema = sequelize.define('UserCinema', {
  ...commonAttributes,
});

//---------------------------------
// Room
//---------------------------------

export interface Stairs {
  x: number;
  width: number;
}

export interface RoomAttributes {
  id?: number;
  name: string;
  width: number | null;
  depth: number | null;
  rowAmount: number | null;
  colAmount: number | null;
  cinemaId: number;
}

export interface RoomInstance extends Model<RoomAttributes>, RoomAttributes { }

export const Room = sequelize.define<RoomInstance>("Room", {
  ...commonAttributes,

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.ROOM_NAME_MIN_LEN, Constants.ROOM_NAME_MAX_LEN],
        msg: Messages.ROOM_ERR_NAME_LEN
      }
    }
  },

  width: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    validate: {
      min: { args: [Constants.ROOM_WIDTH_MIN_VAL], msg: Messages.ROOM_ERR_WIDTH },
      max: { args: [Constants.ROOM_WIDTH_MAX_VAL], msg: Messages.ROOM_ERR_WIDTH }
    },
    defaultValue: Constants.ROOM_WIDTH_DEF_VAL
  },

  depth: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    validate: {
      min: { args: [Constants.ROOM_DEPTH_MIN_VAL], msg: Messages.ROOM_ERR_DEPTH },
      max: { args: [Constants.ROOM_DEPTH_MAX_VAL], msg: Messages.ROOM_ERR_DEPTH }
    },
    defaultValue: Constants.ROOM_DEPTH_DEF_VAL
  },

  rowAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [Constants.ROOM_ROWS_MIN_VAL], msg: Messages.ROOM_ERR_ROWS },
      max: { args: [Constants.ROOM_ROWS_MAX_VAL], msg: Messages.ROOM_ERR_ROWS }
    },
    defaultValue: Constants.ROOM_ROWS_DEF_VAL
  },

  colAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [Constants.ROOM_COLS_MIN_VAL], msg: Messages.ROOM_ERR_COLS },
      max: { args: [Constants.ROOM_COLS_MAX_VAL], msg: Messages.ROOM_ERR_COLS }
    },
    defaultValue: Constants.ROOM_COLS_DEF_VAL
  },

  cinemaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.CINEMA_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.CINEMA_ERR_ID
      }
    }
  },
});

//---------------------------------
// Seat
//---------------------------------

export interface SeatAttributes {
  id?: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  row: number;
  column: number;
  type: string;
  roomId: number;
}

export interface SeatInstance extends Model<SeatAttributes>, SeatAttributes { }

export interface SeatAttributes {
  id?: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  row: number;
  column: number;
  type: string;
  roomId: number;
}

export interface SeatInstance extends Model<SeatAttributes>, SeatAttributes { }

export const Seat = sequelize.define<SeatInstance>("Seat", {
  ...commonAttributes,
  x: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: true,
      min: {
        args: [Constants.SEAT_X_MIN_VAL],
        msg: Messages.SEAT_ERR_X_VAL
      }
    }
  },
  y: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: true,
      min: {
        args: [Constants.SEAT_Y_MIN_VAL],
        msg: Messages.SEAT_ERR_Y_VAL
      }
    }
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: Constants.SEAT_WIDTH_DEF_VAL,
    validate: {
      min: {
        args: [Constants.SEAT_WIDTH_MIN_VAL],
        msg: Messages.SEAT_ERR_WIDTH_VAL
      },
      max: {
        args: [Constants.SEAT_WIDTH_MAX_VAL],
        msg: Messages.SEAT_ERR_WIDTH_VAL
      }
    }
  },
  depth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: Constants.SEAT_DEPTH_DEF_VAL,
    validate: {
      min: {
        args: [Constants.SEAT_DEPTH_MIN_VAL],
        msg: Messages.SEAT_ERR_DEPTH_VAL
      },
      max: {
        args: [Constants.SEAT_DEPTH_MAX_VAL],
        msg: Messages.SEAT_ERR_DEPTH_VAL
      }
    }
  },
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: Messages.SEAT_ERR_ROW_VAL
      },
      max: {
        args: [Constants.ROOM_ROWS_MAX_VAL],
        msg: Messages.SEAT_ERR_ROW_VAL
      }
    }
  },
  column: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: Messages.SEAT_ERR_COL_VAL
      },
      max: {
        args: [Constants.ROOM_COLS_MAX_VAL],
        msg: Messages.SEAT_ERR_COL_VAL
      }
    }
  },
  type: {
    type: DataTypes.ENUM(...Constants.SEAT_TYPES),
    allowNull: false,
    defaultValue: Constants.SEAT_TYPES[0],
    validate: {
      isIn: {
        args: [Constants.SEAT_TYPES as unknown as string[][]],
        msg: Messages.SEAT_ERR_TYPE
      }
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.ROOM_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.ROOM_ERR_ID
      }
    }
  },
});

//---------------------------------
// Screening
//---------------------------------

export interface ScreeningAttributes {
  id?: number;
  startDate: Date;
  basePrice: number;
  movieId: number;
  roomId: number;
}

export interface ScreeningInstance extends Model<ScreeningAttributes>, ScreeningAttributes { }

export const Screening = sequelize.define<ScreeningInstance>("Screening", {
  ...commonAttributes,
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        args: true,
        msg: Messages.SCREENING_ERR_START_DATE
      },
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    validate: {
      isNumeric: true
    },
    defaultValue: Constants.SCREENING_BASE_SEAT_PRICE
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.MOVIE_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.MOVIE_ERR_ID
      }
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.ROOM_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.ROOM_ERR_ID
      }
    }
  },
});

//---------------------------------
// Movie
//---------------------------------

export interface MovieAttributes {
  id?: number;
  title: string;
  viewingFormat: string;
  duration: number;
  description: string;
  posterUrl: string;
  trailerUrl: string;
  language: string;
  premiereDate: Date;
  genre: string;
  restrictions: string;
  cast: string | null;
  directors: string | null;
}

export interface MovieInstance extends Model<MovieAttributes>, MovieAttributes { }

export const Movie = sequelize.define<MovieInstance>("Movie", {
  ...commonAttributes,
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.MOVIE_TITLE_MIN_LEN, Constants.MOVIE_TITLE_MAX_LEN],
        msg: Messages.MOVIE_ERR_TITLE_LEN
      }
    }
  },
  // HD, 3D, 4K etc.
  viewingFormat: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: Constants.MOVIE_STD_VIEWING_FORMATS[0]
  },
  // Duration in minutes
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.MOVIE_DUR_MIN, Constants.MOVIE_DUR_MAX],
        msg: Messages.MOVIE_ERR_DURATION
      }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.MOVIE_DESC_MIN_LEN, Constants.MOVIE_DESC_MAX_LEN],
        msg: Messages.MOVIE_ERR_DESC
      }
    }
  },
  posterUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: {
        msg: Messages.MOVIE_ERR_POSTER_URL
      }
    }
  },
  trailerUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: Messages.MOVIE_ERR_TRAILER_URL
      }
    }
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.MOVIE_LANG_MIN_LEN, Constants.MOVIE_LANG_MAX_LEN],
        msg: Messages.MOVIE_ERR_LANG_LEN
      }
    }
  },
  premiereDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        args: true,
        msg: Messages.MOVIE_ERR_PREMIERE_DATE
      }
    }
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [Constants.MOVIE_GENRE_MIN_LEN, Constants.MOVIE_GENRE_MAX_LEN],
        msg: Messages.MOVIE_ERR_GENRE_LEN
      }
    }
  },
  // 18+, 7+, no restrictions etc.
  restrictions: {
    type: DataTypes.ENUM(...Constants.MOVIE_AGE_RESTRICTIONS),
    allowNull: false,
    defaultValue: Constants.MOVIE_AGE_RESTRICTIONS[2]
  },
  // Full cast names after commas
  cast: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [Constants.MOVIE_CAST_MIN_LEN, Constants.MOVIE_CAST_MAX_LEN],
        msg: Messages.MOVIE_ERR_CAST_LEN
      }
    }
  },
  directors: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [Constants.MOVIE_DIR_MIN_LEN, Constants.MOVIE_DIR_MAX_LEN],
        msg: Messages.MOVIE_ERR_DIR_LEN
      }
    }
  },
});

//---------------------------------
// Reservation
//---------------------------------

export interface ReservationAttributes {
  id?: number;
  reservationDate: Date | null;
  type: string;
  seatId: number;
  screeningId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationInstance extends Model<ReservationAttributes>, ReservationAttributes {
    Screening: ScreeningInstance;
    Seat: SeatInstance;
    User: UserInstance;
}

interface ReservationCreationAttributes extends Optional<ReservationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export const Reservation = sequelize.define<ReservationInstance, ReservationCreationAttributes>("Reservation", {
  ...commonAttributes,
  reservationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        args: true,
        msg: Messages.RESERVATION_ERR_DATE
      }
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: Constants.RESERVATION_TYPES[0],
    validate: {
      isIn: {
        args: [Constants.RESERVATION_TYPES as unknown as string[][]],
        msg: Messages.RESERVATION_ERR_TYPE
      }
    }
  },
  seatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.SEAT_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.SEAT_ERR_ID
      }
    }
  },
  screeningId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.SCREENING_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.SCREENING_ERR_ID
      }
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: {
        msg: Messages.USER_ERR_ID
      },
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.USER_ERR_ID
      }
    }
  }
},
{
  timestamps: true, 
  tableName: "Reservation", 
});

//---------------------------------
// Product
//---------------------------------

export interface ProductAttributes {
  id?: number;
  name: string;
  price: number;
  size: string;
  discount: number;
  cinemaId: number;
}

export interface ProductInstance extends Model<ProductAttributes>, ProductAttributes { }

export const Product = sequelize.define<ProductInstance>("Product", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: {
        args: [Constants.PRODUCT_NAME_MIN_LEN, Constants.PRODUCT_NAME_MAX_LEN],
        msg: Messages.PRODUCT_ERR_NAME_LEN
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: {
        args: [Constants.PRODUCT_PRICE_MIN_VAL],
        msg: Messages.PRODUCT_ERR_PRICE
      }
    }
  },
  size: {
    type: DataTypes.ENUM(...Constants.PRODUCT_SIZES),
    allowNull: false,
    defaultValue: Constants.PRODUCT_SIZES[1]
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: Constants.PRODUCT_DISCOUNT_MIN_VAL,
    validate: {
      len: {
        args: [Constants.PRODUCT_DISCOUNT_MIN_VAL, Constants.PRODUCT_DISCOUNT_MAX_VAL],
        msg: Messages.PRODUCT_ERR_DISCOUNT
      }
    }
  },
  cinemaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [Constants.TYPICAL_MIN_ID],
        msg: Messages.CINEMA_ERR_ID
      }
    }
  }
});

//---------------------------------
// Associations
//---------------------------------
Cinema.hasMany(Room, { foreignKey: "cinemaId", onDelete: 'CASCADE', hooks: true });
Room.belongsTo(Cinema, { foreignKey: "cinemaId" });

Cinema.hasMany(Product, { foreignKey: "cinemaId", onDelete: 'CASCADE', hooks: true });
Product.belongsTo(Cinema, { foreignKey: "cinemaId" });

User.belongsToMany(Cinema, { through: 'UserCinema', as: 'cinemas', foreignKey: 'userId', onDelete: 'CASCADE' });
Cinema.belongsToMany(User, { through: 'UserCinema', as: 'admins', foreignKey: 'cinemaId', onDelete: 'CASCADE' });

Room.hasMany(Screening, { foreignKey: "roomId", onDelete: 'CASCADE', hooks: true });
Screening.belongsTo(Room, { foreignKey: "roomId" });

Room.hasMany(Seat, { foreignKey: "roomId", onDelete: 'CASCADE', hooks: true });
Seat.belongsTo(Room, { foreignKey: "roomId", as: "Room" })

Reservation.belongsTo(Seat, { foreignKey: "seatId" });

Screening.hasMany(Reservation, { foreignKey: "screeningId", onDelete: 'CASCADE', hooks: true });
Reservation.belongsTo(Screening, { foreignKey: "screeningId" });

Movie.hasMany(Screening, { foreignKey: "movieId", onDelete: 'RESTRICT' });
Screening.belongsTo(Movie, { foreignKey: "movieId" });

User.hasMany(Reservation, { foreignKey: "userId", onDelete: 'CASCADE', hooks: true });
Reservation.belongsTo(User, { foreignKey: "userId" });

export default sequelize;
