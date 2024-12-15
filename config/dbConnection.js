const mongoose = require("mongoose");

// Connect to MongoDB
const dbConnection = () => {
  try {
    const connect = mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB".blue);
  } catch (err) {
    console.error("MongoDB connection error:", err.red);
  }
};
module.exports = dbConnection;
