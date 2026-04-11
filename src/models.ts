import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import * as Constants from "./constants.ts";
import * as Messages from "./messages.ts";

const sequelize: Sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "db.sqlite",
  logging: false,
});

try {
  async ()=>{
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  }
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

const commonAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
    validate: {
      isNumeric: true,
      min: 1
    }
  },
};

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

export interface CinemaInstance extends Model<CinemaAttributes>, CinemaAttributes {}

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
      len: {
        args: [Constants.CINEMA_MIN_LATITUDE, Constants.CINEMA_MAX_LATITUDE],
        msg: Messages.CINEMA_ERR_LATITUDE_VAL
      }
    }
  },

  // Accepts longitudes between -180 and 180 (degrees)
  longitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      len: {
        args: [Constants.CINEMA_MIN_LONGITUDE, Constants.CINEMA_MAX_LONGITUDE],
        msg: Messages.CINEMA_ERR_LONGITUDE_VAL
      }
    }
  },
});

//---------------------------------
// Room
//---------------------------------

export interface RoomAttributes {
  id?: number;
  name: string;
  chairPlacement: string;
  cinemaId: number;
}

export interface RoomInstance extends Model<RoomAttributes>, RoomAttributes {}

export const Room = sequelize.define<RoomInstance>("Room", {
  ...commonAttributes,

  // Accepts names that are between 1 and 64 characters long
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
  // A string containing the layout of chairs in the room as well as spacing between chairs (eg. A20, A50, G50, A20; )
  // Chairs are split with ',' and rows are split with ';'
    // - 'A' notes an available normal chair
    // - 'B' notes a booked normal chair
    // - 'C' notes a blocked normal chair
    // - 'D' notes an available special needs chair
    // - 'E' notes a booked special needs chair
    // - 'F' notes a blocked special needs chair
    // - 'G' notes an available VIP chair
    // - 'H' notes a booked VIP chair
    // - 'I' notes a blocked VIP chair
  chairPlacement: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: Constants.ROOM_LAYOUT_REGEX,
        msg: Messages.ROOM_ERR_LAYOUT
      }
    }
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
// Screening
//---------------------------------

export interface ScreeningAttributes {
  id?: number;
  startDate: Date;
  movieId: number;
  roomId: number;
}

export interface ScreeningInstance extends Model<ScreeningAttributes>, ScreeningAttributes {}

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
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: true,
      min: 1
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
  cast: string;
  director: string;
}

export interface MovieInstance extends Model<MovieAttributes>, MovieAttributes {}

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
    allowNull: false,
    validate: { 
      len: {
        args: [Constants.MOVIE_CAST_MIN_LEN, Constants.MOVIE_CAST_MAX_LEN],
        msg: Messages.MOVIE_ERR_CAST_LEN
      } 
    }
  },
  director: {
    type: DataTypes.STRING,
    allowNull: false,
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
  row: number;
  column: number;
  dateOfReservation: Date;
  screeningId: number;
  clientId: number;
}

export interface ReservationInstance extends Model<ReservationAttributes>, ReservationAttributes {}

export const Reservation = sequelize.define<ReservationInstance>("Reservation", {
  ...commonAttributes,
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  column: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dateOfReservation: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  screeningId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

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
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

export const User = sequelize.define<UserInstance>("User", {
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

export interface ProductInstance extends Model<ProductAttributes>, ProductAttributes {}

export const Product = sequelize.define<ProductInstance>("Product", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  cinemaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

//---------------------------------
// Associations
//---------------------------------

Cinema.hasMany(Room, { foreignKey: "cinemaId" });
Room.belongsTo(Cinema, { foreignKey: "cinemaId" });

Room.hasMany(Screening, { foreignKey: "roomId" });
Screening.belongsTo(Room, { foreignKey: "roomId" });

Movie.hasMany(Screening, { foreignKey: "movieId" });
Screening.belongsTo(Movie, { foreignKey: "movieId" });

Screening.hasMany(Reservation, { foreignKey: "screeningId" });
Reservation.belongsTo(Screening, { foreignKey: "screeningId" });

User.hasMany(Reservation, { foreignKey: "clientId" });
Reservation.belongsTo(User, { foreignKey: "clientId" });

Cinema.hasMany(Product, { foreignKey: "cinemaId" });
Product.belongsTo(Cinema, { foreignKey: "cinemaId" });

export default sequelize;
