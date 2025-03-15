import { SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const dynamoDbClient = new DynamoDBClient({});
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME;

export const catalogBatchProcess: SQSHandler = async (
  event: SQSEvent
): Promise<void> => {
  if (!PRODUCTS_TABLE || !STOCKS_TABLE_NAME) {
    console.error(`Env variables is not set properly`);
    return;
  }

  console.log("Incoming event:", event);

  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    console.log("Recieved product", product);
  }
};
