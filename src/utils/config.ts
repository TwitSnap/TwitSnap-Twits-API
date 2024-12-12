import dotenv from 'dotenv';
import { Helpers } from "./helpers";

dotenv.config();

const requiredEnvVars = [
    'PORT',
    "LOG_ROUTE", "LOGGING",
    "LOG_ERROR", "LOG_DEBUG", "LOG_INFO",  "USERS_MS_URI",
    "NOTIF_MS_URI","TEST_MATCH","AURA_URI","AURA_USER","AURA_PASSWORD",
    "AURA_TEST_URI","AURA_TEST_USER","AURA_TEST_PASSWORD", "SERVICE_KEY"
];

Helpers.validateEnvVarsList(requiredEnvVars);

// ? Server config
export const PORT = process.env.PORT;
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;
export const SERVICE_KEY = process.env.SERVICE_KEY as string;

// ? Logger config
export const LOG_ROUTE = process.env.LOG_ROUTE;
export const LOGGING = process.env.LOGGING;
export const LOG_ERROR = process.env.LOG_ERROR;
export const LOG_DEBUG = process.env.LOG_DEBUG;
export const LOG_INFO = process.env.LOG_INFO;

// ? Database config
export const AURA_URI= process.env.AURA_URI as string;
export const AURA_USER= process.env.AURA_USER as string;
export const AURA_PASSWORD= process.env.AURA_PASSWORD as string;

export const AURA_TEST_URI= process.env.AURA_TEST_URI as string;
export const AURA_TEST_USER= process.env.AURA_TEST_USER as string;
export const AURA_TEST_PASSWORD= process.env.AURA_TEST_PASSWORD as string;


// ? Other microservices info
export const USERS_MS_URI = process.env.USERS_MS_URI as string;
export const GET_USER_ID_FROM_USER_EMAIL_ENDPOINT_PATH = process.env.GET_USER_ID_FROM_USER_EMAIL_ENDPOINT_PATH as string;
export const NOTIF_MS_URI = process.env.NOTIF_MS_URI as string;