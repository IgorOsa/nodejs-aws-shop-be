import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { products as mockProducts } from "./mocks/products";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const products = ${JSON.stringify(mockProducts)};
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Headers" : "Content-Type",
              "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify(products)
          };
        };
      `),
        handler: "index.handler",
      }
    );

    const getProductsByIdLambda = new lambda.Function(
      this,
      "GetProductsByIdLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const products = ${JSON.stringify(mockProducts)};
          const productId = event.pathParameters.productId;
          const product = products.find(p => p.id === productId);

          if (!product) {
            return {
              statusCode: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
              },
              body: JSON.stringify({ message: "Product not found" }),
            };
          }

          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Headers" : "Content-Type",
              "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify(product),
          };
        };
      `),
        handler: "index.handler",
      }
    );

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

function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "method.response.header.Access-Control-Allow-Origin":
              "'https://d2qorf0xmzna5y.cloudfront.net'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,POST,PUT,DELETE'",
          },
        },
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Methods": true,
          },
        },
      ],
    }
  );
}
