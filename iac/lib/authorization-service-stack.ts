import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { BASIC_AUTHORIZER_LAMBDA_NAME } from "./common/constants";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaLayer = new lambda.LayerVersion(
      this,
      "AuthorizationServiceLayer",
      {
        code: lambda.Code.fromAsset("../backend/build/layer"),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        description: "A layer containing node_modules",
      }
    );

    const basicAuthorizer = new lambda.Function(this, "BasicAuthorizer", {
      functionName: BASIC_AUTHORIZER_LAMBDA_NAME,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "basicAuthorizer.basicAuthorizer",
      code: lambda.Code.fromAsset("../backend/dist/authorization-service"),
      environment: {
        [process.env.GITHUB_ACCOUNT_LOGIN ?? "IgorOsa"]:
          process.env.GITHUB_ACCOUNT_PASSWORD ?? "",
      },
      layers: [lambdaLayer],
    });
  }
}
