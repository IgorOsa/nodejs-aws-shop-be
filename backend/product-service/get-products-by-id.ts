import { httpResponse } from "./common/http-responses";
import { products } from "./mocks/products";

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
 *                   example: "1"
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
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return httpResponse(404, {
      message: "Product not found",
    });
  }

  return httpResponse(200, product);
};
