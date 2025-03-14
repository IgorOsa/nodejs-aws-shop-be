import { Readable, PassThrough } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SdkStreamMixin } from "@aws-sdk/types";
import { mockClient } from "aws-sdk-client-mock";
import { S3Event } from "aws-lambda";
import { importFileParser } from "./../../import-service/importFileParser";

// Mock the S3Client
const s3Mock = mockClient(S3Client);

describe("importFileParser", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("should process a CSV file and log records", async () => {
    const mockCsvData = `id,title,description,price,count\n1,Title,Example description,10,2\n`;
    const mockStream = new PassThrough();
    mockStream.end(mockCsvData);

    s3Mock.on(GetObjectCommand).resolves({
      Body: mockStream as unknown as Readable & SdkStreamMixin,
    });

    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "test-key.csv" },
          },
        },
      ],
    };

    const mockContext = {} as any;
    const mockCallback = () => {};

    await importFileParser(mockEvent as any, mockContext, mockCallback);

    await new Promise((resolve) => setImmediate(resolve));

    // Assertions
    expect(consoleLogSpy).toHaveBeenCalledWith("Record:", {
      id: "1",
      title: "Title",
      description: "Example description",
      price: "10",
      count: "2",
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "CSV file successfully processed"
    );

    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it("should log an error if CSV processing fails", async () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: { name: "test-bucket" },
            object: { key: "uploaded/test.csv" },
          },
        },
      ],
    } as any;

    s3Mock
      .on(GetObjectCommand, {
        Bucket: "test-bucket",
        Key: "uploaded/test.csv",
      })
      .rejects(new Error("S3 error"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    await importFileParser(event, {} as any, () => {});

    expect(errorSpy).toHaveBeenCalledWith(
      "Error processing CSV file:",
      new Error("S3 error")
    );
  });
});
