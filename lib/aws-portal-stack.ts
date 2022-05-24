import * as logs from "@aws-cdk/aws-logs";
import { CustomResource, Stack, Construct, StackProps } from "@aws-cdk/core";
import * as cr from "@aws-cdk/custom-resources";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

export class AwsPortalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const COLLECTION_ID = "DEMO_RESOURCE";
    const weatherResourceRole = new iam.Role(
      this,
      "weatherCustomResourceRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );

    weatherResourceRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["arn:aws:weather:*"],
        actions: ["weather:CreateCollections"],
      })
    );

    const onEvent = new lambda.Function(this, "weatherCustomResourceFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "weather-resource.handler",
      code: lambda.Code.fromAsset(path.resolve(__dirname, "functions")),
      environment: {
        COLLECTION_ID,
      },
    });

    const weatherCustomResourceProcider = new cr.Provider(
      this,
      "weatherCustomResourceProvider",
      {
        onEventHandler: onEvent,
        logRetention: logs.RetentionDays.ONE_DAY,
      }
    );

    new CustomResource(this, "weatherCustomResource", {
      serviceToken: weatherCustomResourceProcider.serviceToken,
    });
  }
}
