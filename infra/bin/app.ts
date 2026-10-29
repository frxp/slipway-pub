import { App } from 'aws-cdk-lib'
import { SlipwayStack } from '../lib/stack'

const app = new App()

new SlipwayStack(app, 'SlipwayStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-central-1',
  },
})
