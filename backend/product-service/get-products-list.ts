import { httpResponse } from "./common/http-responses";
import { products } from "./mocks/products";

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
 *                     type: UUID
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
  return httpResponse(200, products);
};
