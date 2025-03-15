import { S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { Readable } from "stream";
import * as csv from "csv-parser";

const MESSAGE_BATCH_SIZE = 5;

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const queueUrl = process.env.SQS_QUEUE_URL;

export const importFileParser: S3Handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    const s3Stream = response.Body as Readable;

    const messages: { Id: string; MessageBody: string }[] = [];
    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on("data", async (data) => {
          try {
            s3Stream.pause();
            messages.push({
              Id: `${messages.length}`,
              MessageBody: JSON.stringify({
                title: data.title,
                description: data.description,
                price: Number(data.price),
                count: Number(data.count),
              }),
            });

            if (messages.length === MESSAGE_BATCH_SIZE) {
              await sendMessageBatch(messages);
              messages.length = 0;
            }
            s3Stream.resume();
          } catch (error) {
            console.error("Error sending message to SQS:", error);
          }
        })
        .on("end", async () => {
          if (messages.length > 0) {
            await sendMessageBatch(messages);
          }
          resolve("CSV file successfully processed");
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    console.log("CSV file successfully processed");
  } catch (error) {
    console.error("Error processing CSV file:", error);
  }

  const copyParams = {
    Bucket: bucket,
    CopySource: `${bucket}/${key}`,
    Key: key.replace("uploaded/", "parsed/"),
  };

  try {
    await s3Client.send(new CopyObjectCommand(copyParams));
    await s3Client.send(new DeleteObjectCommand(params));

    console.log(`File moved from to /parsed folder`);
  } catch (error) {
    console.error("Error moving CSV file:", error);
  }
};

async function sendMessageBatch(
  messages: { Id: string; MessageBody: string }[]
) {
  const sqsParams = {
    QueueUrl: queueUrl,
    Entries: messages,
  };
  await sqsClient.send(new SendMessageBatchCommand(sqsParams));
  console.log(`Batch of messages sent to queue`, {
    sqsParams: JSON.stringify(sqsParams),
  });
}
