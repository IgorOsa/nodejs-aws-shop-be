import { handler } from "../product-service/get-products-list";

test("handler returns a list of products", async () => {
  const response = await handler();
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toBeInstanceOf(Array);
});
