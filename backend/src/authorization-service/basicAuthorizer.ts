import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  Context,
  StatementEffect,
} from "aws-lambda";
import * as dotenv from "dotenv";

dotenv.config();

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  if (!event.authorizationToken) {
    return generatePolicy("Deny", "user", event.methodArn);
  }

  const token = event.authorizationToken.split(" ")[1];
  if (!token) {
    return generatePolicy("Deny", "user", event.methodArn);
  }

  try {
    const decodedToken = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = decodedToken.split(":");

    const storedPassword = process.env[username];

    if (storedPassword && storedPassword === password) {
      return generatePolicy("Allow", username, event.methodArn);
    }
  } catch (err) {
    console.error(err);
  }

  return generatePolicy("Deny", "user", event.methodArn);
};

const generatePolicy = (
  effect: StatementEffect,
  principalId: string,
  resource: string
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
