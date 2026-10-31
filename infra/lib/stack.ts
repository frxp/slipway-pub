import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Platform } from 'aws-cdk-lib/aws-ecr-assets'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'

export class SlipwayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Public subnets for the API, so the stack needs no NAT gateway. The database has no route out.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'data', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    })

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_18 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      databaseName: 'app',
      credentials: rds.Credentials.fromGeneratedSecret('app'),
      allocatedStorage: 20,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
    })
    const databaseSecret = database.secret!

    const appKey = new secretsmanager.Secret(this, 'AppKey', {
      generateSecretString: { passwordLength: 32, excludePunctuation: true },
    })

    // API: the production image on Fargate behind a load balancer. ARM64 is the default on
    // Apple Silicon, so the image built on a laptop matches the task that runs it.
    const api = new patterns.ApplicationLoadBalancedFargateService(this, 'Api', {
      vpc,
      taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      minHealthyPercent: 100,
      assignPublicIp: true,
      runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.ARM64 },
      circuitBreaker: { rollback: true },
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../api', {
          file: 'Dockerfile.prod',
          platform: Platform.LINUX_ARM64,
        }),
        containerPort: 8000,
        environment: {
          DB_HOST: database.dbInstanceEndpointAddress,
          DB_DATABASE: 'app',
          TRUSTED_PROXIES: '*',
        },
        secrets: {
          APP_KEY: ecs.Secret.fromSecretsManager(appKey),
          DB_USERNAME: ecs.Secret.fromSecretsManager(databaseSecret, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret, 'password'),
        },
      },
    })
    api.targetGroup.configureHealthCheck({ path: '/api/health' })
    database.connections.allowDefaultPortFrom(api.service)

    // Web: static files in a private bucket. CloudFront serves them and the API from one
    // HTTPS origin, so the browser needs neither CORS nor a certificate on the load balancer.
    const bucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // The SPA handles routing, so paths without a file return index.html. A distribution-wide
    // error page would also rewrite the API's own 403 and 404 responses.
    const spaFallback = new cloudfront.Function(this, 'SpaFallback', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          if (!event.request.uri.includes('.')) event.request.uri = '/index.html'
          return event.request
        }
      `),
    })

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: spaFallback },
        ],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(api.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    })

    new s3deploy.BucketDeployment(this, 'WebDeployment', {
      sources: [s3deploy.Source.asset('../web/dist')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    })

    const url = `https://${distribution.distributionDomainName}`
    api.taskDefinition.defaultContainer!.addEnvironment('APP_URL', url)
    api.taskDefinition.defaultContainer!.addEnvironment('WEB_URL', url)

    new CfnOutput(this, 'Url', { value: url })
  }
}
