import * as logs from "@aws-cdk/aws-logs";
import {
  CustomResource,
  Stack,
  StackProps,
  Construct,
  CfnOutput,
} from "@aws-cdk/core";
import "dotenv/config";
import * as cr from "@aws-cdk/custom-resources";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

export class AwsPortalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const WEATHER_KEY = process.env.WEATHER_KEY;
    const RAPID_API_KEY = process.env.RAPID_API_KEY;

    const api = this.apiGatewayFactory();

    new CfnOutput(this, "apiUrl", { value: api.url });

    // Define layers here:
    const nodeFetchLayer = new lambda.LayerVersion(this, "node-fetch-layer", {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset("lambda-layers/node-fetch"),
      description: "Uses a 3rd party library called node-fetch",
    });

    // Lambda creation here:
    const weatherLambda = this.createLambdaShell(
      "weather",
      WEATHER_KEY as string,
      "WEATHER_KEY",
      [nodeFetchLayer]
    );
    const stockLambda = this.createLambdaShell(
      "stocks",
      RAPID_API_KEY as string,
      "RAPID_API_KEY",
      [nodeFetchLayer]
    );
    const cryptoNewsLambda = this.createLambdaShell(
      "crypto-news",
      RAPID_API_KEY as string,
      "RAPID_API_KEY",
      [nodeFetchLayer]
    );
    // endpoints defined here:
    const weatherApiResource = api.root.addResource("weather");
    const stockApiResource = api.root.addResource("stocks");
    const cryptoNewsApiResource = api.root.addResource("crypto-news");

    // attach lambdas to endpoints here:
    weatherApiResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(weatherLambda.lambda, { proxy: true })
    );
    stockApiResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(stockLambda.lambda, { proxy: true })
    );
    cryptoNewsApiResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(cryptoNewsLambda.lambda, { proxy: true })
    );

    // define custom resources here:
    new CustomResource(this, "weatherCustomResource", {
      serviceToken: weatherLambda.crp.serviceToken,
    });
    new CustomResource(this, "stockCustomResource", {
      serviceToken: stockLambda.crp.serviceToken,
    });
    new CustomResource(this, "cryptoNewsCustomResource", {
      serviceToken: cryptoNewsLambda.crp.serviceToken,
    });
  }

  /**
   * Creates a lambda shell deployable by Cloudformation.
   * @param name lambda name.
   * @param envVar currently a string but considering turning it into a array for multiple.
   * @returns a custom resource provider and lambda
   */
  private createLambdaShell = (
    name: string,
    envVar: string,
    key: string,
    layers?: lambda.LayerVersion[]
  ): { crp: cr.Provider; lambda: lambda.Function } => {
    const customResourceRole = new iam.Role(this, `${name}CustomResourceRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    customResourceRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:${name}:*`],
        actions: [`${name}:CreateCollections`],
      })
    );
    // TODO: Restructure folder structure for lambdas
    const onEvent = new lambda.Function(this, name, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `${name}-resource.handler`,
      code: lambda.Code.fromAsset(path.resolve(`js/lib/functions/${name}`)),
      environment: {
        [key]: envVar,
      },
      layers: layers,
    });

    return {
      crp: new cr.Provider(this, `${name}CustomResourceProvider`, {
        onEventHandler: onEvent,
        logRetention: logs.RetentionDays.ONE_DAY,
      }),
      lambda: onEvent,
    };
  };

  private apiGatewayFactory = (): apigateway.RestApi => {
    return new apigateway.RestApi(this, "dashboard", {
      description: "Dashboard BE",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });
  };
}
