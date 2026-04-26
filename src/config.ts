import dotenv from 'dotenv';
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.APP_PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',

  DB: {
    DIALECT: (process.env.DB_DIALECT || 'sqlite'),

    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '3306', 10),
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: isTest ? (process.env.DB_NAME_TEST || 'cinema_test') : (process.env.DB_NAME || 'cinema_db'),

    STORAGE: process.env.DB_STORAGE || 'db.sqlite',
    TEST_STORAGE: process.env.DB_TEST_STORAGE || ':memory:',

    LOGGING: process.env.DB_LOGGING === 'true',
    FORCE_SYNC: process.env.DB_FORCE_SYNC === 'true',
  },

  INITIAL_OWNER: {
    NAME: process.env.INITIAL_OWNER_NAME || 'The Owner',
    PASSWORD: process.env.INITIAL_OWNER_PASSWORD || 'owner_password',
    EMAIL: process.env.INITIAL_OWNER_EMAIL || 'owner@email.com',
    PHONE_NUMBER: process.env.INITIAL_OWNER_PHONE_NUMBER || '777888999'
  }
};
