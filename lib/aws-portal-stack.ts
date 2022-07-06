import * as logs from "@aws-cdk/aws-logs";
import {
  CustomResource,
  Stack,
  StackProps,
  Construct,
  CfnOutput,
} from "@aws-cdk/core";
import * as cr from "@aws-cdk/custom-resources";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as path from "path";
require("dotenv").config();

const config = {
  env: {
    account: "130634351702",
    region: "us-east-1",
  },
};
export class AwsPortalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, { ...props, env: config.env });

    // TODO: turn into key map?
    const WEATHER_KEY = process.env.WEATHER_KEY;
    const RAPID_API_KEY = process.env.RAPID_API_KEY;
    const CRYPTO_PANIC_TOKEN = process.env.CRYPTO_PANIC_TOKEN;

    const api = this.createApiGateway();

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
      CRYPTO_PANIC_TOKEN as string,
      "CRYPTO_PANIC_TOKEN",
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
    this.createEc2Instance();
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

  private createEc2Instance = (): CfnOutput => {
    // Get the default VPC. This is the network where your instance will be provisioned
    // All activated regions in AWS have a default vpc.
    // You can create your own of course as well. https://aws.amazon.com/vpc/
    const defaultVpc = ec2.Vpc.fromLookup(this, "VPC", { isDefault: true });

    // Lets create a role for the instance
    // You can attach permissions to a role and determine what your
    // instance can or can not do
    const role = new iam.Role(
      this,
      "clay-dashboard-1-role", // this is a unique id that will represent this resource in a Cloudformation template
      { assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com") }
    );

    // lets create a security group for our instance
    // A security group acts as a virtual firewall for your instance to control inbound and outbound traffic.
    const securityGroup = new ec2.SecurityGroup(this, "clay-dashboard-1-sg", {
      vpc: defaultVpc,
      allowAllOutbound: true, // will let your instance send outboud traffic
      securityGroupName: "clay-dashboard-1-sg",
    });

    // lets use the security group to allow inbound traffic on specific ports
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allows SSH access from Internet"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allows HTTP access from Internet"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allows HTTPS access from Internet"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "Allows local access"
    );

    // Finally lets provision our ec2 instance
    const instance = new ec2.Instance(this, "clay-dashboard-1", {
      vpc: defaultVpc,
      role: role,
      securityGroup: securityGroup,
      instanceName: "clay-dashboard-1",
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),

      keyName: "clay-dashboard-1-key",
    });

    // CfnOutput lets us output prperties of the resources we create after they are created
    // we want the ip address of this new instance so we can ssh into it later
    return new CfnOutput(this, "clay-dashboard-1-output", {
      value: instance.instancePublicIp,
    });
  };

  private createApiGateway = (): apigateway.RestApi => {
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
