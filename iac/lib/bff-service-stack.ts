import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dotenv from "dotenv";

dotenv.config();

export class BffServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const beanstalkUrl = "http://igorosa-bff-api-develop.eu-central-1.elasticbeanstalk.com";

    const httpApi = new apigwv2.HttpApi(this, "BffServiceHttpApi", {
      apiName: "BFF Service HTTP API",
      description: "HTTP API Gateway for BFF Service (proxy to Elastic Beanstalk)",
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
      },
      createDefaultStage: false,
    });

    httpApi.addStage("dev", {
      stageName: "dev",
      autoDeploy: true,
    });

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new integrations.HttpUrlIntegration(
        "BeanstalkProxyIntegration",
        beanstalkUrl + "/{proxy}"
      ),
    });

    new cdk.CfnOutput(this, "BffServiceApiEndpoint", {
      value: httpApi.apiEndpoint + "/dev/",
    });
  }
}
