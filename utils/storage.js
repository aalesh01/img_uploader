import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certPath = path.resolve(__dirname, "../certs/isrgrootx1.pem");

const uri =
  "mongodb+srv://aaleshpatilinft:AaAyAdu2EAmWsL7I@cluster0.snq4o.mongodb.net/?retryWrites=true&w=majority&appName=cluster0"; // Replace with your connection string

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsCAFile: certPath
};


const client = new MongoClient(uri, options);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("IMG");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export { db, client, connectToDatabase };
