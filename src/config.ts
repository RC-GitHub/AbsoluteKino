import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.APP_PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  DB: {
    DIALECT: process.env.DB_DIALECT || 'sqlite',
    STORAGE: process.env.DB_STORAGE || 'db.sqlite',
    LOGGING: process.env.DB_LOGGING === 'true',
    FORCE_SYNC: process.env.DB_FORCE_SYNC === 'true',
  },

  INITIAL_OWNER: {
    NAME: process.env.INITIAL_OWNER_NAME || 'The Owner',
    PASSWORD: process.env.INITIAL_OWNER_PASSWORD || 'owner_password',
    EMAIL: process.env.INITIAL_OWNER_EMAIL || 'owner@email.com',
    PHONE_NUMBER: process.env.INITIAL_OWNER_PHONE_NUMBER || 777888999
  }
};