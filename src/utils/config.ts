import dotenv from 'dotenv';
import { Helpers } from "./helpers";

dotenv.config();

const requiredEnvVars = [
    'PORT', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', "JWT_SECRET",
    'DB_SYNCHRONIZE', 'DB_LOGGING', 'DB_TYPE', "LOG_ROUTE", "LOGGING",
    "LOG_ERROR", "LOG_DEBUG", "LOG_INFO", "JWT_EXPIRATION_TIME", "USERS_MS_URI",
    "GET_USER_ID_FROM_USER_EMAIL_ENDPOINT_PATH"
];

Helpers.validateEnvVarsList(requiredEnvVars);

// ? Server config
export const PORT = process.env.PORT;
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;

// ? Logger config
export const LOG_ROUTE = process.env.LOG_ROUTE;
export const LOGGING = process.env.LOGGING;
export const LOG_ERROR = process.env.LOG_ERROR;
export const LOG_DEBUG = process.env.LOG_DEBUG;
export const LOG_INFO = process.env.LOG_INFO;

// ? Database config
export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = process.env.DB_PORT;
export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_NAME = process.env.DB_NAME;
export const DB_SYNCHRONIZE = process.env.DB_SYNCHRONIZE;
export const DB_LOGGING = process.env.DB_LOGGING;
export const DB_TYPE = process.env.DB_TYPE;
export const JWT_SECRET = process.env.JWT_SECRET;
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// ? Other microservices info
export const USERS_MS_URI = process.env.USERS_MS_URI as string;
export const GET_USER_ID_FROM_USER_EMAIL_ENDPOINT_PATH = process.env.GET_USER_ID_FROM_USER_EMAIL_ENDPOINT_PATH as string;
