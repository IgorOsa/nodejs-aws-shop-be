import { S3Handler } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as csv from "csv-parser";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const importFileParser: S3Handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);
  const s3Stream = response.Body as Readable;

  s3Stream
    .pipe(csv())
    .on("data", (data) => {
      console.log("Record:", data);
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
    })
    .on("error", (error) => {
      console.error("Error processing CSV file:", error);
    });
};
