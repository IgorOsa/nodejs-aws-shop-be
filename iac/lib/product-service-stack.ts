import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { addCorsOptions } from "./common";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "products",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const stocksTable = new dynamodb.Table(this, "StocksTable", {
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      tableName: "stocks",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lambdaLayer = new lambda.LayerVersion(this, "ImportServiceLayer", {
      code: lambda.Code.fromAsset("../backend/build/layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer containing node_modules",
    });

    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("../backend/dist"),
        handler: "index.getProductsListHandler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
        layers: [lambdaLayer],
      }
    );

    const getProductsByIdLambda = new lambda.Function(
      this,
      "GetProductsByIdLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("../backend/dist"),
        handler: "index.getProductsByIdHandler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
        layers: [lambdaLayer],
      }
    );

    const createProductLambda = new lambda.Function(
      this,
      "CreateProductLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("../backend/dist"),
        handler: "index.createProductHandler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
        layers: [lambdaLayer],
      }
    );

    productsTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getProductsByIdLambda);
    stocksTable.grantReadData(getProductsListLambda);
    stocksTable.grantReadData(getProductsByIdLambda);

    productsTable.grant(getProductsListLambda, "dynamodb:Scan");
    productsTable.grant(getProductsByIdLambda, "dynamodb:GetItem");
    stocksTable.grant(getProductsListLambda, "dynamodb:Scan");
    stocksTable.grant(getProductsByIdLambda, "dynamodb:GetItem");

    productsTable.grantReadWriteData(createProductLambda);
    stocksTable.grantReadWriteData(createProductLambda);

    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service API",
      description: "This service serves product data.",
      deployOptions: {
        stageName: "dev",
      },
    });

    const productsResource = api.root.addResource("products");
    addCorsOptions(productsResource);
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda)
    );

    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda)
    );

    const productByIdResource = productsResource.addResource("{productId}");
    addCorsOptions(productByIdResource);
    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambda)
    );

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "The URL of the Product Service API",
    });
  }
}
