import { handler } from "../../product-service/create-product";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { httpResponse } from "../../common/http-responses";

jest.mock("@aws-sdk/client-dynamodb");
jest.mock("../../common/http-responses");

const mockDynamoDbClient = DynamoDBClient as jest.MockedClass<
  typeof DynamoDBClient
>;
const mockHttpResponse = httpResponse as jest.MockedFunction<
  typeof httpResponse
>;

describe("create-product handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpResponse.mockImplementation((statusCode, body) => ({
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(body),
    }));
  });

  it("should create a new product successfully", async () => {
    const event = {
      body: JSON.stringify({
        title: "Product 1",
        description: "This is a product description.",
        price: 100,
        count: 10,
      }),
    };

    mockDynamoDbClient.prototype.send.mockResolvedValueOnce({} as never);

    const response = await handler(event);

    expect(mockDynamoDbClient.prototype.send).toHaveBeenCalledWith(
      expect.any(TransactWriteItemsCommand)
    );
    expect(mockHttpResponse).toHaveBeenCalledWith(201, expect.any(Object));
    expect(response.statusCode).toBe(201);
  });

  it("should return validation errors for invalid input", async () => {
    const event = {
      body: JSON.stringify({
        title: "",
        description: "",
        price: -1,
        count: -1,
      }),
    };

    const response = await handler(event);

    expect(mockHttpResponse).toHaveBeenCalledWith(400, expect.any(Object));
    expect(response.statusCode).toBe(400);
  });

  it("should handle internal server errors", async () => {
    const event = {
      body: JSON.stringify({
        title: "Product 1",
        description: "This is a product description.",
        price: 100,
        count: 10,
      }),
    };

    mockDynamoDbClient.prototype.send.mockRejectedValue(
      new Error("DynamoDB error") as never
    );

    const response = await handler(event);

    expect(mockHttpResponse).toHaveBeenCalledWith(500, expect.any(Object));
    expect(response.statusCode).toBe(500);
  });
});
