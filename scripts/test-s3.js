const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

async function testS3Connection() {
  console.log('🔍 Testing S3 Configuration...\n');
  
  // Check if environment variables are set
  const config = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET_NAME
  };
  
  console.log('📋 Environment Variables:');
  console.log(`  AWS_REGION: ${config.region ? '✅ Set' : '❌ Missing'}`);
  console.log(`  AWS_ACCESS_KEY_ID: ${config.accessKeyId ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`  AWS_SECRET_ACCESS_KEY: ${config.secretAccessKey ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`  AWS_S3_BUCKET_NAME: ${config.bucketName ? `✅ ${config.bucketName}` : '❌ Missing'}`);
  console.log('');
  
  if (!config.region || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    console.log('❌ Missing required AWS configuration. Please check your .env.local file.');
    process.exit(1);
  }
  
  // Create S3 client
  const s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  
  try {
    // Test 1: List buckets to verify credentials
    console.log('🔐 Testing AWS Credentials...');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    console.log(`✅ AWS credentials are valid! Found ${listResponse.Buckets.length} bucket(s)\n`);
    
    // Test 2: Check if the specified bucket exists and is accessible
    console.log(`🪣 Testing access to bucket: ${config.bucketName}...`);
    const headCommand = new HeadBucketCommand({ Bucket: config.bucketName });
    await s3Client.send(headCommand);
    console.log(`✅ Bucket "${config.bucketName}" exists and is accessible!\n`);
    
    // Summary
    console.log('🎉 SUCCESS! Your S3 configuration is working correctly!');
    console.log('You can now upload headshots for realtors.');
    
  } catch (error) {
    console.log('\n❌ S3 Connection Test Failed!\n');
    
    if (error.name === 'InvalidUserID.NotFound' || error.name === 'InvalidAccessKeyId') {
      console.log('Error: Invalid AWS Access Key ID');
      console.log('Please check that your AWS_ACCESS_KEY_ID is correct.');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('Error: Invalid AWS Secret Access Key');
      console.log('Please check that your AWS_SECRET_ACCESS_KEY is correct.');
    } else if (error.name === 'NoSuchBucket' || error.name === 'NotFound') {
      console.log(`Error: Bucket "${config.bucketName}" not found`);
      console.log('Please check that your AWS_S3_BUCKET_NAME is correct.');
    } else if (error.name === 'AccessDenied' || error.name === 'Forbidden') {
      console.log(`Error: Access denied to bucket "${config.bucketName}"`);
      console.log('Please check that your AWS credentials have the necessary permissions.');
    } else {
      console.log(`Error: ${error.message}`);
    }
    
    console.log('\nPlease verify your AWS configuration in .env.local');
    process.exit(1);
  }
}

// Run the test
testS3Connection();