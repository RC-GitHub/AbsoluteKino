import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "db.sqlite",
});

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

const commonAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
};

export const Cinema = sequelize.define("Cinema", {
  ...commonAttributes,
  // Accepts names that are between 1 and 64 characters long
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    len: [1,64]
  },

  // Accepts addresses like:
    // - LOCATION_ABBREVIATIONS LOCATION_NAME LOCATION_NUMBER (optionally with an added letter) 
    // - LOCATION_NUMBER (optionally with an added letter) LOCATION_NAME LOCATION_ABBREVIATIONS
    // -- (optionally, in both cases, after a comma other info could be displayed such as CITY_NAME or POSTAL_CODE)
  // Where:
    // - LOCATION_NAME accepts any character besides digits and special characters (with an exception of a dash and and a dot) and has to be at least 1 character long
    // - LOCATION_NUMBER accepts up to 4 digits
    // - LOCATION_NUMBER_LETTER accepts 1 lowercase latin alphabet characters
    // - CITY_NAME/POSTAL_CODE accepts any character besides special characters (with an exception of a dash)
  // Examples:
    // 13 Green Bannerman Road, London
    // ul. Wielosławska 34b
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    is: /^((a-z.)+ [^\d!@#$%^&*()_+=\[\]{};':"\\|,<>?\/]+ \d{1,4}[a-z]?|\d{1,4}[a-z]? [^\d!@#$%^&*()_+=\[\]{};':"\\|,<>?\/]+ (a-z.)+)+(, [^!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/]+)*$/i,
  },

  // Accepts latitudes between -90 and 90 (degrees)
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    min: -90,
    max: 90
  },

  // Accepts longitudes between -180 and 180 (degrees)
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    min: -180,
    max: 180
  },
});

export const Room = sequelize.define("Room", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // A string containing the layout of chairs in the room as well as spacing between chairs (eg. A20, A50, G50, A20; )
  // Chairs are split with ',' and rows are split with ';'
  // 'A' notes an available normal chair
  // 'B' notes a booked normal chair
  // 'C' notes a blocked normal chair
  // 'D' notes an available special needs chair
  // 'E' notes a booked special needs chair
  // 'F' notes a blocked special needs chair
  // 'G' notes an available VIP chair
  // 'H' notes a booked VIP chair
  // 'I' notes a blocked VIP chair
  chairPlacement: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cinemaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export const Screening = sequelize.define("Screening", {
  ...commonAttributes,
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export const Movie = sequelize.define("Movie", {
  ...commonAttributes,
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // HD, 3D, 4K etc.
  viewingFormat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // duration in minutes
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  posterUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trailerUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  premiereDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  restriction: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cast: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  director: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export const Reservation = sequelize.define("Reservation", {
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

export const User = sequelize.define("User", {
  ...commonAttributes,
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // client | admin
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
    isEmail: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    isUnique: true,
    validate: {
      len: [9, 12],
    },
  },
});

export const Product = sequelize.define("Product", {
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
