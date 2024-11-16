import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { connectToDatabase, db } from './utils/storage.js';
import { validateCsv } from "./utils/validateCsv.js";
import { processImage } from "./workers/imageProcessor.js";

connectToDatabase();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const app = express();

app.use(express.json());

app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const requestId = uuidv4();
  const products = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => products.push(row))
      .on("end", async () => {
        await db.collection("requests").insertOne({
          _id: requestId,
          status: "pending",
          createdAt: new Date(),
          processedCount: 0,
          totalCount: products.length,
        });

        const productsToInsert = products.map((product) => ({
          requestId,
          productName: product["Product Name"],
          inputUrls: product["Input Image Urls"]
            .split(",")
            .map((url) => url.trim()),
          outputUrls: [],
        }));

        await db.collection("products").insertMany(productsToInsert);

        res.status(200).json({
          requestId,
          message: "CSV uploaded successfully. Processing started.",
        });


        for (const product of products) {
          const inputUrls = product["Input Image Urls"]
            .split(",")
            .map((url) => url.trim());
          const outputUrls = [];

          for (const url of inputUrls) {
            const processedUrl = await processImage(url);
            outputUrls.push(processedUrl);
          }

          await db
            .collection("products")
            .updateOne(
              { requestId, productName: product["Product Name"] },
              { $set: { outputUrls } }
            );

          const request = await db
            .collection("requests")
            .findOne({ _id: requestId });
          const { processedCount, totalCount } = request;
          const newProcessedCount = processedCount + 1;
          const newStatus =
            newProcessedCount === totalCount ? "completed" : "processing";

          await db
            .collection("requests")
            .updateOne(
              { _id: requestId },
              { $set: { processedCount: newProcessedCount, status: newStatus } }
            );
        }

        fs.unlinkSync(filePath);
      });
  } catch (err) {
    console.error("Error processing CSV:", err);
    res.status(500).json({ error: "Error processing CSV" });
  }
});

app.get("/status/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const request = await db.collection("requests").findOne({ _id: requestId });

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  res.status(200).json(request);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
