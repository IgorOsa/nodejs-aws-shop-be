import { handler } from "../../product-service/get-products-by-id";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { httpResponse } from "../../common/http-responses";

const dynamoDbMock = mockClient(DynamoDBClient);

describe("get-products-by-id handler", () => {
  beforeEach(() => {
    dynamoDbMock.reset();
  });

  it("should return a product by ID", async () => {
    const productId = "123";
    const event = { pathParameters: { productId } };

    dynamoDbMock
      .on(GetItemCommand, {
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Key: { id: { S: productId } },
      })
      .resolves({
        Item: {
          id: { S: productId },
          title: { S: "Product 1" },
          description: { S: "Description 1" },
          price: { N: "100" },
        },
      });

    dynamoDbMock
      .on(GetItemCommand, {
        TableName: process.env.STOCKS_TABLE_NAME,
        Key: { product_id: { S: productId } },
      })
      .resolves({
        Item: {
          product_id: { S: productId },
          count: { N: "10" },
        },
      });

    const response = await handler(event);

    expect(response).toEqual(
      httpResponse(200, {
        id: productId,
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 10,
      })
    );
  });

  it("should return 404 if product not found", async () => {
    const productId = "123";
    const event = { pathParameters: { productId } };

    dynamoDbMock.on(GetItemCommand).resolves({});

    const response = await handler(event);

    expect(response).toEqual(
      httpResponse(404, { message: "Product not found" })
    );
  });

  it("should return 500 on internal server error", async () => {
    const productId = "123";
    const event = { pathParameters: { productId } };

    dynamoDbMock.on(GetItemCommand).rejects(new Error("Internal Server Error"));

    const response = await handler(event);

    expect(response).toEqual(
      httpResponse(500, {
        message: "Internal Server Error",
        error: new Error("Internal Server Error"),
      })
    );
  });
});
