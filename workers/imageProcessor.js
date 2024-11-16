import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { GridFSBucket } from "mongodb"; 
import { Readable } from "stream";
import { db } from "../utils/storage.js"; 

export const processImage = async (imageUrl) => {
  const bucket = new GridFSBucket(db, {
    bucketName: "images", 
  });
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resizedBuffer = await sharp(buffer).jpeg({ quality: 50 }).toBuffer();

    const outputFileName = `output/${uuidv4()}.jpg`;

    const bufferStream = new Readable();
    bufferStream.push(resizedBuffer);
    bufferStream.push(null); 

    const uploadStream = bucket.openUploadStream(outputFileName);

    bufferStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", () => resolve(uploadStream.id)); 
      uploadStream.on("error", (err) => reject(err)); 
    });

    return uploadStream.id;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
