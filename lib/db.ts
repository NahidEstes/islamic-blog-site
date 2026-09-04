import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};
const cache = globalForMongoose.mongooseCache ?? {
  connection: null,
  promise: null
};
globalForMongoose.mongooseCache = cache;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not configured. Copy .env.example to .env.local and add a connection string."
    );
  }
  if (cache.connection) return cache.connection;
  cache.promise ??= mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000
  });
  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
