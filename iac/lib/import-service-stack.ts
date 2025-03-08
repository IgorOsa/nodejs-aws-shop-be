import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { addCorsOptions } from "./common";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportServiceBucket", {
      bucketName: `import-service-bucket-20250308-dev`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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

    bucket.grantPut(importProductsFileLambda);
    bucket.grantRead(importProductsFileLambda);

    const importFileParserLambda = new lambda.Function(
      this,
      "ImportFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.importFileParser",
        code: lambda.Code.fromAsset("../backend/dist"),
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
        layers: [lambdaLayer],
      }
    );

    bucket.grantRead(importFileParserLambda);

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
    });

    const importResource = api.root.addResource("import");
    addCorsOptions(importResource);
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
    );

    api.addRequestValidator("queryValidator", {
      validateRequestParameters: true,
    });
  }
}
