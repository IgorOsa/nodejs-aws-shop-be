import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as crypto from "crypto";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hash = crypto.randomBytes(4).toString("hex");

    const bucket = new s3.CfnBucket(this, "ImportServiceBucket", {
      bucketName: `import-service-bucket-${hash}-dev`,
      lifecycleConfiguration: {
        rules: [
          {
            id: "CreateUploadedFolder",
            status: "Enabled",
            prefix: "uploaded/",
            expirationInDays: 365,
          },
        ],
      },
    });
  }
}
