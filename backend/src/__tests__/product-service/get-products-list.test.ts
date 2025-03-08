import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { handler } from "../../product-service/get-products-list";
import { httpResponse } from "../../common/http-responses";

jest.mock("@aws-sdk/client-dynamodb");
jest.mock("../../common/http-responses");

const mockSend = jest.fn();
DynamoDBClient.prototype.send = mockSend;

describe("get-products-list handler", () => {
  const PRODUCTS_TABLE_NAME = "ProductsTable";
  const STOCKS_TABLE_NAME = "StocksTable";

  beforeEach(() => {
    process.env.PRODUCTS_TABLE_NAME = PRODUCTS_TABLE_NAME;
    process.env.STOCKS_TABLE_NAME = STOCKS_TABLE_NAME;
    jest.clearAllMocks();
  });

  it("should return a list of products with their stock counts", async () => {
    // Mock DynamoDB responses
    const mockProductsData = {
      Items: [
        {
          id: { S: "1" },
          title: { S: "Product 1" },
          description: { S: "Description 1" },
          price: { N: "100" },
        },
        {
          id: { S: "2" },
          title: { S: "Product 2" },
          description: { S: "Description 2" },
          price: { N: "200" },
        },
      ],
    };

    const mockStocksData = {
      Items: [
        { product_id: { S: "1" }, count: { N: "10" } },
        { product_id: { S: "2" }, count: { N: "20" } },
      ],
    };

    mockSend
      .mockResolvedValueOnce(mockProductsData) // First call for products
      .mockResolvedValueOnce(mockStocksData); // Second call for stocks

    // Mock httpResponse
    const mockHttpResponse = jest.fn();
    (httpResponse as jest.Mock).mockImplementation(mockHttpResponse);

    // Call the handler
    const result = await handler();

    // Expected joined data
    const expectedData = [
      {
        id: "1",
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 10,
      },
      {
        id: "2",
        title: "Product 2",
        description: "Description 2",
        price: 200,
        count: 20,
      },
    ];

    // Assertions
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(ScanCommand));
    expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(ScanCommand));
    expect(httpResponse).toHaveBeenCalledWith(200, expectedData);
    expect(result).toBe(mockHttpResponse());
  });

  it("should return an empty list if no products are found", async () => {
    // Mock DynamoDB responses
    const mockProductsData = { Items: [] };
    const mockStocksData = { Items: [] };

    mockSend
      .mockResolvedValueOnce(mockProductsData) // First call for products
      .mockResolvedValueOnce(mockStocksData); // Second call for stocks

    // Mock httpResponse
    const mockHttpResponse = jest.fn();
    (httpResponse as jest.Mock).mockImplementation(mockHttpResponse);

    // Call the handler
    const result = await handler();

    // Assertions
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(httpResponse).toHaveBeenCalledWith(200, []);
    expect(result).toBe(mockHttpResponse());
  });

  it("should return a 500 error if an exception occurs", async () => {
    // Mock DynamoDB to throw an error
    const mockError = new Error("DynamoDB error");
    mockSend.mockRejectedValueOnce(mockError);

    // Mock httpResponse
    const mockHttpResponse = jest.fn();
    (httpResponse as jest.Mock).mockImplementation(mockHttpResponse);

    // Call the handler
    const result = await handler();

    // Assertions
    expect(mockSend).toHaveBeenCalledTimes(1); // Only the first call fails
    expect(httpResponse).toHaveBeenCalledWith(500, {
      message: "Internal Server Error",
      error: mockError.message, // Update to match the expected format
    });
    expect(result).toBe(mockHttpResponse());
  });
});
