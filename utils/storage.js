import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://aaleshpatilinft:AaAyAdu2EAmWsL7I@cluster0.snq4o.mongodb.net/?retryWrites=true&w=majority&appName=cluster0"; // Replace with your connection string
const client = new MongoClient(uri);

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
