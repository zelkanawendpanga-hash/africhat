const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("fs");
const path = require("path");

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      const dbPath = path.join(__dirname, "..", "data", "mongodb");
      fs.mkdirSync(dbPath, { recursive: true });
      const memoryServer = await MongoMemoryServer.create({
        instance: { dbPath, launchTimeout: 30000 },
      });
      mongoUri = memoryServer.getUri();
      console.log(`✅ MongoDB local persistant démarré (${dbPath})`);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
