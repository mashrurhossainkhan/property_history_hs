const mongoose = require("mongoose");
require("dotenv").config();

const DATABASE_URL = process.env.DATABASE_URL;

const options = {
    maxPoolSize: 20,                  // Maximum number of connections in the pool
    minPoolSize: 5,                   // Minimum number of connections in the pool
    serverSelectionTimeoutMS: 5000,   // Timeout for initial server selection
    socketTimeoutMS: 45000,           // Closes inactive sockets after 45 seconds
    connectTimeoutMS: 30000,          // Timeout for initial connection attempts
  };

mongoose.connection.once("open", () => {
    console.log(`Mongodb Connection is ready..🚀🚀`);
});
mongoose.connection.on("error", (err) => {
    console.log("Database connection error:", err);
});

async function ConnectDB() {
    try {
        await mongoose.connect(DATABASE_URL, options);
        console.log("Connected to the database");
    } catch (err) {
        console.error("Error connecting to the database:", err);
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log("Disconnected from the database");
    } catch (err) {
        console.error("Error disconnecting from the database:", err);
    }
}

module.exports = {
    ConnectDB,
    disconnectDB,
};
