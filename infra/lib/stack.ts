import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import type { Construct } from 'constructs'

export class SlipwayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Web: static files in a private bucket, served through CloudFront.
    const bucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      // The SPA handles routing, so unknown paths return index.html.
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.seconds(0),
      })),
    })

    new s3deploy.BucketDeployment(this, 'WebDeployment', {
      sources: [s3deploy.Source.asset('../web/dist')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    })

    // API: the production image on Fargate behind a load balancer.
    // Public subnets only, so the stack needs no NAT gateway.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC }],
    })

    const api = new patterns.ApplicationLoadBalancedFargateService(this, 'Api', {
      vpc,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      assignPublicIp: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../api', { file: 'Dockerfile.prod' }),
        containerPort: 8000,
        environment: {
          WEB_URL: `https://${distribution.distributionDomainName}`,
        },
      },
    })
    api.targetGroup.configureHealthCheck({ path: '/api/health' })

    new CfnOutput(this, 'WebUrl', { value: `https://${distribution.distributionDomainName}` })
    new CfnOutput(this, 'ApiUrl', { value: `http://${api.loadBalancer.loadBalancerDnsName}/api` })
  }
}
