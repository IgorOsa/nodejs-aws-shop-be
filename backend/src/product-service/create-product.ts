import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { httpResponse } from "../common/http-responses";
import { validateProductData } from "./common/validators";

const dynamoDbClient = new DynamoDBClient({});
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME;

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The product title.
 *                 example: "Product 1"
 *               description:
 *                 type: string
 *                 description: The product description.
 *                 example: "This is a product description."
 *               price:
 *                 type: number
 *                 description: The product price.
 *                 example: 100
 *               count:
 *                 type: number
 *                 description: The product count.
 *                 example: 10
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The product ID.
 *                   example: "7567ec4b-b10c-48c5-9345-fc73c48a80aa"
 *                 count:
 *                   type: number
 *                   description: The product count.
 *                   example: 10
 */

export const handler = async (event: { body: string }) => {
  try {
    console.log("Incoming request:", event);

    const { title, description, price, count } = JSON.parse(event.body);

    const validationErrors = validateProductData(
      title,
      description,
      price,
      count
    );
    if (validationErrors) {
      console.error("Validation errors:", validationErrors);
      return httpResponse(400, {
        message: "Validation errors",
        errors: validationErrors,
      });
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

    await dynamoDbClient.send(
      new TransactWriteItemsCommand({
        TransactItems: [productItem, stockItem],
      })
    );

    return httpResponse(201, { id, title, description, price, count });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return httpResponse(500, { message: "Internal Server Error", error });
  }
};
