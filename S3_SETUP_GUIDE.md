# AWS S3 Setup Guide for Headshot Uploads

The application is fully functional without S3 configuration. You can create, edit, and delete realtors without uploading headshots. If you want to enable headshot uploads, follow this guide.

## Quick Setup (Optional)

### 1. Create an AWS Account

- Go to [AWS Console](https://aws.amazon.com/)
- Create a free tier account if you don't have one

### 2. Create an S3 Bucket

1. Go to S3 service in AWS Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `your-app-realtors-headshots`)
4. Select a region (e.g., `us-east-1`)
5. Keep other settings as default
6. Click "Create bucket"

### 3. Configure Bucket CORS

1. Go to your bucket
2. Click on "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4. Make Bucket Public for Reading (Optional)

If you want headshots to be publicly accessible:

1. Go to "Permissions" tab
2. Edit "Block public access" - uncheck "Block all public access"
3. Add bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/realtors/headshots/*"
    }
  ]
}
```

### 5. Create IAM User for Programmatic Access

1. Go to IAM service
2. Click "Users" → "Add users"
3. Enter username (e.g., `hdphotohub-s3-user`)
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select `AmazonS3FullAccess` (or create custom policy for your bucket only)
8. Complete the creation
9. **Save the Access Key ID and Secret Access Key**

### 6. Update Environment Variables

Add to both `.env` and `.env.local`:

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-from-step-5"
AWS_SECRET_ACCESS_KEY="your-secret-key-from-step-5"
AWS_S3_BUCKET_NAME="your-bucket-name-from-step-2"
```

### 7. Restart Your Application

```bash
npm run dev
```

## Testing Without S3

The application works perfectly without S3:

1. **Create Realtors**: All fields work except headshot upload
2. **Edit Realtors**: Update any information
3. **Delete Realtors**: Remove realtors from the system
4. **View Realtors**: See all realtors in a table with avatar placeholders

## Troubleshooting

### "S3 is not configured" Error

- This is expected if you haven't set up AWS credentials
- The application will still work for all other features

### "Failed to upload headshot" Error

- Check your AWS credentials in `.env.local`
- Verify your bucket name is correct
- Ensure CORS is properly configured
- Check IAM user has S3 permissions

### Production Deployment

- Use environment variables in your hosting platform (Vercel, etc.)
- Consider using AWS IAM roles instead of access keys
- Use CloudFront CDN for better performance
- Implement image optimization with Sharp or similar

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use IAM policies** with minimal required permissions
3. **Enable versioning** on your S3 bucket
4. **Set up lifecycle rules** to manage old files
5. **Monitor AWS billing** to avoid unexpected charges

## Alternative Solutions

If you don't want to use AWS S3:

1. **Cloudinary**: Easier setup, built-in transformations
2. **Uploadthing**: Simple for Next.js apps
3. **Supabase Storage**: If using Supabase for database
4. **Local Storage**: For development only (not recommended for production)

---

**Note**: The application is designed to work with or without S3. File uploads are completely optional and don't affect the core functionality of managing realtors.
