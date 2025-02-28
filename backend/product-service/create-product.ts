import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { httpResponse } from "./common/http-responses";

const dynamoDbClient = new DynamoDBClient({});
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;

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
 */
export const handler = async (event: { body: string }) => {
  try {
    const { title, description, price } = JSON.parse(event.body);

    if (!title || !description || !price) {
      return httpResponse(400, {
        message: "title, description or price are missing",
      });
    }

    const id = randomUUID();

    const productItem = {
      id: { S: id },
      title: { S: title },
      description: { S: description },
      price: { N: price.toString() },
    };

    await dynamoDbClient.send(
      new PutItemCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Item: productItem,
      })
    );

    return httpResponse(201, { id, title, description, price });
  } catch (error) {
    return httpResponse(500, { message: "Internal Server Error", error });
  }
};
