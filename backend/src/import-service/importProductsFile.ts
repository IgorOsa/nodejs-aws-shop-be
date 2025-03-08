import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { httpResponse } from "../common/http-responses";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const importProductFile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const fileName = event.queryStringParameters?.name;
  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing file name" }),
    };
  }

  const params = {
    Bucket: process.env.BUCKET_NAME!,
    Key: `uploaded/${fileName}`,
    ContentType: "text/csv",
  };

  try {
    const command = new PutObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return httpResponse(200, signedUrl);
  } catch (error) {
    console.error("Could not generate signed URL:", error);
    return httpResponse(500, {
      message: "Could not generate signed URL",
      error,
    });
  }
};
