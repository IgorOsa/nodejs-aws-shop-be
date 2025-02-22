import { products as mockProducts } from "./mocks/products";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

export const handler = async (event: any) => {
  const products = mockProducts;
  const productId = event.pathParameters.productId;
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(product),
  };
};
