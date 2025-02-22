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
 *                     type: string
 *                     description: The product ID.
 *                     example: "1"
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
