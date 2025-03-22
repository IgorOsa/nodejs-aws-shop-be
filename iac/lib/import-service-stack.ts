import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  BASIC_AUTHORIZER_LAMBDA_NAME,
  CATALOG_ITEMS_QUEUE_NAME,
} from "./common/constants";
import { AuthorizationServiceStack } from "./authorization-service-stack";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportServiceBucket", {
      bucketName: `import-service-bucket-20250308-dev`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
          exposedHeaders: ["ETag", "x-amz-meta-custom-header"],
          maxAge: 3000,
        },
      ],
    });

    const lambdaLayer = new lambda.LayerVersion(this, "ImportServiceLayer", {
      code: lambda.Code.fromAsset("../backend/build/layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer containing node_modules",
    });

    const importProductsFileLambda = new lambda.Function(
      this,
      "ImportProductsFileLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.importProductFile",
        code: lambda.Code.fromAsset("../backend/dist"),
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
        layers: [lambdaLayer],
      }
    );

    bucket.grantReadWrite(importProductsFileLambda);

    const importFileParserLambda = new lambda.Function(
      this,
      "ImportFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.importFileParser",
        code: lambda.Code.fromAsset("../backend/dist"),
        environment: {
          BUCKET_NAME: bucket.bucketName,
          SQS_QUEUE_URL: `https://sqs.${this.region}.amazonaws.com/${this.account}/${CATALOG_ITEMS_QUEUE_NAME}`,
        },
        layers: [lambdaLayer],
      }
    );

    bucket.grantReadWrite(importFileParserLambda);

    importFileParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:CopyObject",
          "sqs:SendMessage", // Added permission to send messages to SQS
        ],
        resources: [
          bucket.bucketArn + "/*",
          `arn:aws:sqs:${this.region}:${this.account}:${CATALOG_ITEMS_QUEUE_NAME}`,
        ],
      })
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service API",
      description: "This service imports product data",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const basicAuthorizer = lambda.Function.fromFunctionArn(
      this,
      "BasicAuthorizer",
      `arn:aws:lambda:${this.region}:${this.account}:function:${BASIC_AUTHORIZER_LAMBDA_NAME}`
    );

    const authorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
      handler: basicAuthorizer,
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
        requestValidatorOptions: {
          validateRequestParameters: true,
        },
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );
  }
}
