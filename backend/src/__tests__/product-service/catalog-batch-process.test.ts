import "aws-sdk-client-mock-jest";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { catalogBatchProcess } from "./../../product-service/catalog-batch-process";
import { validateProductData } from "./../../common/validators";
import { SQSEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";

const mockDynamoDBClient = mockClient(DynamoDBClient);
const mockSNSClient = mockClient(SNSClient);

jest.mock("./../../common/validators");

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODUCTS_TABLE_NAME = "MockProductsTableName";
    process.env.STOCKS_TABLE_NAME = "MockStocksTableName";
    process.env.CREATE_PRODUCT_TOPIC_ARN = "MockCreateProductTopic";

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    mockDynamoDBClient.onAnyCommand().resolves({});
    mockSNSClient.onAnyCommand().resolves({});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
    mockDynamoDBClient.reset();
    mockSNSClient.reset();
  });

  it("should process valid SQS records and write to DynamoDB and SNS", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 100,
            count: 10,
          }),
          messageId: "",
          receiptHandle: "",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
        },
        {
          body: JSON.stringify({
            title: "Product 2",
            description: "Description 2",
            price: 200,
            count: 20,
          }),
          messageId: "",
          receiptHandle: "",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
        },
      ],
    };

    (validateProductData as any).mockReturnValue(null); // No validation errors

    await catalogBatchProcess(mockEvent);

    // Validate DynamoDB calls
    expect(mockDynamoDBClient.send.calledOnce).toBe(true);
    expect(mockDynamoDBClient).toHaveReceivedCommand(TransactWriteItemsCommand);

    // // Validate SNS calls
    expect(mockSNSClient.send.calledTwice).toBe(true);
    expect(mockSNSClient).toHaveReceivedCommand(PublishCommand);

    // Validate logs
    expect(console.log).toHaveBeenCalledWith(
      "Batch process completed successfully"
    );
  });

  it("should skip invalid records and log validation errors", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "",
            description: "Description 1",
            price: 100,
            count: 10,
          }),
          messageId: "",
          receiptHandle: "",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
        },
      ],
    };

    (validateProductData as any).mockReturnValue(["Title is required"]);

    await catalogBatchProcess(mockEvent);

    //   // Validate DynamoDB and SNS are not called
    expect(mockDynamoDBClient).not.toHaveReceivedCommand(
      TransactWriteItemsCommand
    );
    expect(mockSNSClient).not.toHaveReceivedCommand(PublishCommand);

    //   // Validate logs
    expect(console.error).toHaveBeenCalledWith("Validation errors:", [
      "Title is required",
    ]);
  });

  it("should handle DynamoDB errors gracefully", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 100,
            count: 10,
          }),
          messageId: "",
          receiptHandle: "",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
        },
      ],
    };

    (validateProductData as any).mockReturnValue(null); // No validation errors
    mockDynamoDBClient.onAnyCommand().rejectsOnce(new Error("DynamoDB Error"));

    await catalogBatchProcess(mockEvent);

    expect(mockDynamoDBClient.send.calledOnce).toBe(true);
    expect(mockDynamoDBClient).toHaveReceivedCommand(TransactWriteItemsCommand);
    expect(mockSNSClient).not.toHaveReceivedCommand(PublishCommand);
    expect(console.error).toHaveBeenCalledWith(
      "Internal Server Error:",
      expect.any(Error)
    );
  });

  it("should handle SNS errors gracefully", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 100,
            count: 10,
          }),
          messageId: "",
          receiptHandle: "",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
        },
      ],
    };

    (validateProductData as any).mockReturnValue(null); // No validation errors
    mockSNSClient.onAnyCommand().rejectsOnce(new Error("SNS Client Error"));

    await catalogBatchProcess(mockEvent);

    expect(mockDynamoDBClient.send.calledOnce).toBe(true);
    expect(mockDynamoDBClient).toHaveReceivedCommand(TransactWriteItemsCommand);
    expect(mockSNSClient.send.calledOnce).toBe(true);
    expect(mockSNSClient).toHaveReceivedCommand(PublishCommand);

    // Validate error logs
    expect(console.error).toHaveBeenCalledWith(
      "Internal Server Error:",
      expect.any(Error)
    );
  });
});
