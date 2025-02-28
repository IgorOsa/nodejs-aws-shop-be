import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { httpResponse } from "./common/http-responses";

const dynamoDbClient = new DynamoDBClient({});
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME;

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Retrieve a product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     responses:
 *       200:
 *         description: A single product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The product ID.
 *                   example: "7567ec4b-b10c-48c5-9345-fc73c48a80aa"
 *                 name:
 *                   type: string
 *                   description: The product name.
 *                   example: "Product 1"
 *                 price:
 *                   type: number
 *                   description: The product price.
 *                   example: 100
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 */

export const handler = async (event: {
  pathParameters: { productId: string };
}) => {
  const productId = event.pathParameters.productId;

  try {
    const productData = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: { id: { S: productId } },
      })
    );

    const stockData = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: STOCKS_TABLE_NAME,
        Key: { product_id: { S: productId } },
      })
    );

    if (!productData.Item) {
      return httpResponse(404, { message: "Product not found" });
    }

    const product = {
      id: productData.Item.id.S,
      title: productData.Item.title.S,
      description: productData.Item.description.S,
      price: Number(productData.Item.price.N),
      count: stockData.Item ? Number(stockData.Item.count.N) : 0,
    };

    return httpResponse(200, product);
  } catch (error) {
    return httpResponse(500, { message: "Internal Server Error", error });
  }
};
