import { handler } from "../product-service/get-products-by-id";
import { products } from "../product-service/mocks/products";

describe("get-products-by-id handler", () => {
  it("should return a product when a valid productId is provided", async () => {
    const productId = products[0].id;
    const event = { pathParameters: { productId } };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(products[0]);
  });

  it("should return 404 when the product is not found", async () => {
    const event = { pathParameters: { productId: "non-existent-id" } };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ message: "Product not found" });
  });
});
