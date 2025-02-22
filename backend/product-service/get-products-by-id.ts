import { httpResponse } from "./common/http-responses";
import { products } from "./mocks/products";

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
