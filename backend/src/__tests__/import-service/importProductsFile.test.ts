import { importProductFile } from "../../import-service/importProductsFile";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

describe("importProductFile", () => {
  const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
    typeof getSignedUrl
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return signed URL if file name is provided", async () => {
    const event = {
      queryStringParameters: { name: "test.csv" },
    } as unknown as APIGatewayProxyEvent;
    const signedUrl = "https://signed-url";
    mockGetSignedUrl.mockResolvedValue(signedUrl);

    const result = await importProductFile(event);

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 60 }
    );
    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 200,
        body: JSON.stringify(signedUrl),
        headers: {
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("should return 400 if file name is missing", async () => {
    const event = { queryStringParameters: {} } as APIGatewayProxyEvent;

    const result = await importProductFile(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Missing file name" }),
    });
  });

  it("should return 500 if there is an error generating signed URL", async () => {
    const event = {
      queryStringParameters: { name: "test.csv" },
    } as unknown as APIGatewayProxyEvent;
    const error = new Error("Error generating signed URL");
    mockGetSignedUrl.mockRejectedValue(error);

    const result = await importProductFile(event);

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 500,
        body: JSON.stringify({
          message: "Could not generate signed URL",
          error,
        }),
      })
    );
  });
});
