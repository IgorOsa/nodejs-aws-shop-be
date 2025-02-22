import { products as mockProducts } from "./mocks/products";

export const handler = async (event: any) => {
  const products = mockProducts;
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: JSON.stringify(products),
  };
};
