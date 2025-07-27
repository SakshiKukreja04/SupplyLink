# Render.io Deployment Guide for SupplyLink Backend

## Prerequisites
1. MongoDB Atlas database
2. Firebase Admin SDK credentials
3. Render.io account

## Step 1: Environment Variables in Render.io

Add these environment variables in your Render.io service:

### Required Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/supplylink?retryWrites=true&w=majority
CLIENT_URL=https://supply-link-git-main-sakshi-kukrejas-projects.vercel.app
```

### Firebase Admin Variables:
```
FIREBASE_PROJECT_ID=supplylink-671f6
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@supplylink-671f6.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40supplylink-671f6.iam.gserviceaccount.com
```

### Optional Variables:
```
LOG_LEVEL=info
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Step 2: Render.io Service Configuration

### Build Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: Leave empty (default)

### Environment:
- **Environment**: Node
- **Node Version**: 18.x or higher

## Step 3: Get Firebase Admin Credentials

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the values to your Render.io environment variables

## Step 4: MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Get your connection string
4. Add it as `MONGODB_URI` in Render.io

## Step 5: Test Your Deployment

After deployment, test these endpoints:

1. **Health Check**: `https://your-render-url.onrender.com/health`
2. **API Test**: `https://your-render-url.onrender.com/api/user/test`

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Check your connection string
   - Ensure IP is whitelisted in Atlas
   - Verify username/password

2. **CORS Error**:
   - Verify `CLIENT_URL` is correct
   - Check if frontend URL is in allowed origins

3. **Firebase Auth Error**:
   - Verify Firebase Admin credentials
   - Check private key format (should include \n)

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

## Update Frontend Configuration

Once your backend is deployed, update your frontend environment variables:

```env
VITE_API_URL=https://your-render-url.onrender.com
```

## Monitoring

- Check Render.io logs for errors
- Monitor MongoDB Atlas for connection issues
- Test API endpoints regularly 