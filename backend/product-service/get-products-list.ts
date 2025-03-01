import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { httpResponse } from "./common/http-responses";

const dynamoDbClient = new DynamoDBClient({});
const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME;

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve a list of products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The product ID.
 *                     example: "7567ec4b-b10c-48c5-9345-fc73c48a80aa"
 *                   name:
 *                     type: string
 *                     description: The product name.
 *                     example: "Product 1"
 *                   price:
 *                     type: number
 *                     description: The product price.
 *                     example: 100
 */
export const handler = async () => {
  console.log("Incoming request: Get products list");

  try {
    const productsData = await dynamoDbClient.send(
      new ScanCommand({ TableName: PRODUCTS_TABLE_NAME })
    );
    const stocksData = await dynamoDbClient.send(
      new ScanCommand({ TableName: STOCKS_TABLE_NAME })
    );

    if (!productsData.Items || !stocksData.Items) {
      throw new Error("Failed to fetch data from DynamoDB");
    }

    const products = productsData.Items;
    const stocks = stocksData.Items;

    const joinedData = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id.S === product.id.S);
      return {
        id: product.id.S,
        title: product.title.S,
        description: product.description.S,
        price: Number(product.price.N),
        count: stock ? Number(stock.count.N) : 0,
      };
    });

    return httpResponse(200, joinedData);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return httpResponse(500, {
      message: "Internal Server Error",
      error: error.message || error,
    });
  }
};
