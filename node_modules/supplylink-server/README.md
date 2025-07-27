# SupplyLink Backend Server

Express.js backend with Firebase Authentication integration for the SupplyLink platform.

## 🚀 Features

- **Firebase Authentication**: Secure token verification with Firebase Admin SDK
- **Protected Routes**: Role-based access control for suppliers and vendors
- **User Management**: Complete CRUD operations for user profiles
- **Location Services**: GPS coordinate storage and retrieval
- **Firestore Integration**: Seamless data persistence with Firestore
- **CORS Support**: Cross-origin resource sharing for frontend integration
- **Error Handling**: Comprehensive error handling and logging

## 📁 Project Structure

```
server/
├── config/
│   └── firebaseAdmin.js      # Firebase Admin SDK initialization
├── controllers/
│   └── userController.js     # User profile and location controllers
├── middleware/
│   └── verifyFirebaseToken.js # Firebase token verification middleware
├── routes/
│   └── userRoutes.js         # Protected user API routes
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Firebase Service Account Setup

#### Option A: Service Account File (Recommended for Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`supplylink-671f6`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Rename it to `firebase-service-account.json`
7. Place it in the `server/` directory

#### Option B: Environment Variable (Recommended for Production)

1. Copy the service account JSON content
2. Add it to your `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"supplylink-671f6",...}
```

### 3. Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Admin SDK Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🔐 API Endpoints

### Authentication Required
All endpoints below require a valid Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase_id_token>
```

### User Profile Endpoints

#### GET `/api/user/profile`
Get user profile from Firestore.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "emailVerified": true,
    "name": "John Doe",
    "role": "supplier",
    "phone": "+1234567890",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "New York, NY",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/user/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "supplier"
}
```

#### DELETE `/api/user/profile`
Soft delete user account.

### Location Endpoints

#### GET `/api/user/location`
Get user's current location.

#### POST `/api/user/location`
Update user location.

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "New York, NY",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Role-Based Endpoints

#### GET `/api/user/supplier`
Supplier-only endpoint (requires `supplier` role).

#### GET `/api/user/vendor`
Vendor-only endpoint (requires `vendor` role).

#### GET `/api/user/admin`
Admin-only endpoint (requires `admin` role).

### Health Check

#### GET `/api/user/health`
Test authentication and get user info.

## 🔧 Middleware

### Firebase Token Verification
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token with Firebase Admin SDK
- Adds user data to `req.user`

### Role Verification
```javascript
// Example usage
router.get('/admin', verifyRole(['admin']), adminController);
```

### Email Verification
```javascript
// Example usage
router.post('/sensitive-data', requireEmailVerification, controller);
```

## 🧪 Testing the API

### 1. Get Firebase ID Token (Frontend)
```javascript
// In your React app
import { auth } from '@/firebase/firebase';

const getIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    return token;
  }
  return null;
};
```

### 2. Test with cURL
```bash
# Get user profile
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"

# Update location
curl -X POST http://localhost:5000/api/user/location \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  }'
```

### 3. Test with Postman
1. Set request method and URL
2. Add header: `Authorization: Bearer YOUR_FIREBASE_ID_TOKEN`
3. For POST requests, add JSON body
4. Send request

## 🚨 Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authorization header is required",
  "error": "MISSING_AUTH_HEADER"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "INSUFFICIENT_PERMISSIONS",
  "requiredRoles": ["admin"],
  "userRole": "user"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User profile not found",
  "error": "PROFILE_NOT_FOUND"
}
```

## 🔒 Security Features

- **Token Verification**: All requests verified with Firebase Admin SDK
- **Role-Based Access**: Fine-grained permissions based on user roles
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Error Sanitization**: No sensitive data leaked in error responses

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### Logs
The server logs all requests and errors with timestamps:
```
[2024-01-01T00:00:00.000Z] GET /api/user/profile - ::1
✅ Authenticated user: user@example.com (user123)
📋 Retrieved profile for user: user@example.com
```

## 🔧 Development

### Adding New Routes
1. Create controller in `controllers/`
2. Add route in `routes/`
3. Apply `verifyFirebaseToken` middleware
4. Test with valid Firebase token

### Database Integration
The server is ready for database integration. Replace Firestore calls in controllers with your preferred database (MongoDB, PostgreSQL, etc.).

## 📝 License

MIT License - see LICENSE file for details. 