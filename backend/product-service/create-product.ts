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

const validateProductData = (
  title: string,
  description: string,
  price: number,
  count: number
) => {
  const errors = [];

  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("title is required and must be a non-empty string");
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    errors.push("description is required and must be a non-empty string");
  }

  if (typeof price !== "number" || price <= 0) {
    errors.push("price must be a number greater than 0");
  }

  if (typeof count !== "number" || count < 0) {
    errors.push("count must be a number >= 0");
  }

  return errors.length > 0 ? errors : null;
};

export const handler = async (event: { body: string }) => {
  try {
    const { title, description, price, count } = JSON.parse(event.body);

    const validationErrors = validateProductData(
      title,
      description,
      price,
      count
    );
    if (validationErrors) {
      return httpResponse(400, {
        message: "Validation errors",
        errors: validationErrors,
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
