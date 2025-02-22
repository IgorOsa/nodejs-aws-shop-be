import { httpResponse } from "./common/http-responses";
import { products as mockProducts } from "./mocks/products";

export const handler = async () => {
  return httpResponse(200, mockProducts);
};
