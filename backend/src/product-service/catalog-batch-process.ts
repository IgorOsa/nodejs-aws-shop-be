import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";
import { validateProductData } from "./common/validators";
import { SQSEvent } from "aws-lambda";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME;
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;

const dynamoDbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

export const catalogBatchProcess = async (event: SQSEvent) => {
  if (!PRODUCTS_TABLE_NAME || !STOCKS_TABLE_NAME || !CREATE_PRODUCT_TOPIC_ARN) {
    console.error(`Env variables is not set properly`);
    return;
  }

  console.log("Incoming event:", event);

  try {
    const transactItems = [];
    const createdProducts = [];

    for (const record of event.Records) {
      const { title, description, price, count } = JSON.parse(record.body);

      const validationErrors = validateProductData(
        title,
        description,
        price,
        count
      );
      if (validationErrors) {
        console.error("Validation errors:", validationErrors);
        continue; // Skip invalid records
      }

      const id = randomUUID();

      const productItem = {
        Put: {
          TableName: PRODUCTS_TABLE_NAME,
          Item: {
            id: { S: id },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
          },
        },
      };

      const stockItem = {
        Put: {
          TableName: STOCKS_TABLE_NAME,
          Item: {
            product_id: { S: id },
            count: { N: count.toString() },
          },
        },
      };

      transactItems.push(productItem, stockItem);
      createdProducts.push({ id, title, description, price, count });
    }

    if (transactItems.length > 0) {
      await dynamoDbClient.send(
        new TransactWriteItemsCommand({
          TransactItems: transactItems,
        })
      );
    }

    if (createdProducts.length > 0) {
      const result = await snsClient.send(
        new PublishCommand({
          TopicArn: CREATE_PRODUCT_TOPIC_ARN,
          Subject: "New Products Created",
          Message: JSON.stringify(createdProducts),
        })
      );
      console.log("Message sent to sns topic", { result });
    }

    return console.log("Batch process completed successfully");
  } catch (error) {
    console.error("Internal Server Error:", error);
  }
};
