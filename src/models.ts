import { Sequelize, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import * as Constants from "./constants.ts";

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
      len: [Constants.CINEMA_NAME_MIN_LEN, Constants.CINEMA_NAME_MAX_LEN]
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
      is: Constants.CINEMA_POLISH_ADDRESS_REGEX
    }
  },

  // Accepts latitudes between -90 and 90 (degrees)
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: Constants.CINEMA_MIN_LATITUDE,
      max: Constants.CINEMA_MAX_LATITUDE
    }
  },

  // Accepts longitudes between -180 and 180 (degrees)
  longitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: Constants.CINEMA_MIN_LONGITUDE,
      max: Constants.CINEMA_MAX_LONGITUDE
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
      len: [Constants.ROOM_NAME_MIN_LEN, Constants.ROOM_NAME_MAX_LEN]
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
      is: Constants.ROOM_LAYOUT_REGEX
    }
  },

  cinemaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isNumeric: true,
      min: 1
    }
  },
});

//---------------------------------
// Movie
//---------------------------------

export interface ScreeningAttributes {
  id?: number;
  startTime: Date;
  movieId: number;
  roomId: number;
}

export interface ScreeningInstance extends Model<ScreeningAttributes>, ScreeningAttributes {}

export const Screening = sequelize.define<ScreeningInstance>("Screening", {
  ...commonAttributes,
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
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
      isNumeric: true,
      min: 1
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
  restriction: string;
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
      len: [Constants.MOVIE_NAME_MIN_LEN, Constants.MOVIE_NAME_MAX_LEN]
    }
  },
  // HD, 3D, 4K etc.
  viewingFormat: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '2D'
  },
  // Duration in minutes
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { 
      len: [Constants.MOVIE_DUR_MIN_LEN, Constants.MOVIE_DUR_MAX_LEN]
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { 
      len: [Constants.MOVIE_DESC_MIN_LEN, Constants.MOVIE_DESC_MAX_LEN]
    }
  },
  posterUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  trailerUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  premiereDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // 18+, 7+, no restrictions etc.
  restriction: {
    type: DataTypes.ENUM(...Constants.MOVIE_AGE_RESTRICTIONS),
    allowNull: false,
    defaultValue: Constants.MOVIE_AGE_RESTRICTIONS[0]
  },
  // Full cast names after commas
  cast: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  director: {
    type: DataTypes.STRING,
    allowNull: false,
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
  password: string;
  email: string;
  phoneNumber: string;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

export const User = sequelize.define<UserInstance>("User", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Client | Admin
  accountType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUnique: true,
      len: [9, 12],
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
