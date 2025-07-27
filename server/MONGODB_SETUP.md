# MongoDB Setup Guide

## 🔧 **Step 1: Create .env File**

Create a `.env` file in the `server/` directory with the following content:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MongoDB Atlas Configuration
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mcsk3re.mongodb.net/SupplyLink?retryWrites=true&w=majority

# LibreTranslate Configuration (optional)
LIBRE_TRANSLATE_URL=https://libretranslate.de
LIBRE_TRANSLATE_API_KEY=your_api_key_here
```

## 🔑 **Step 2: Get MongoDB Atlas Credentials**

### **Option A: Create New Database User**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in to your account
3. Select your SupplyLink cluster
4. Click "Database Access" in the left sidebar
5. Click "Add New Database User"
6. Fill in the form:
   - **Username**: `supplylink_user` (or any username)
   - **Password**: Create a strong password (save this!)
   - **Database User Privileges**: Select "Read and write to any database"
7. Click "Add User"

### **Option B: Reset Existing User Password**

1. Go to "Database Access"
2. Find your existing user
3. Click "Edit"
4. Click "Edit Password"
5. Set a new password

## 🔗 **Step 3: Update Connection String**

Replace the placeholders in your `.env` file:

```bash
# Replace these values:
MONGODB_URI=mongodb+srv://supplylink_user:YourActualPassword123@cluster0.mcsk3re.mongodb.net/SupplyLink?retryWrites=true&w=majority
```

## 🧪 **Step 4: Test Connection**

Run the test script to verify your connection:

```bash
cd server
node test-mongodb.js
```

## ✅ **Step 5: Start Server**

If the test passes, start your server:

```bash
npm start
```

## 🔧 **Troubleshooting**

### **Authentication Error**
- Check username and password
- Use database user credentials, not Atlas account credentials
- URL-encode special characters in password
- Verify user permissions

### **Network Error**
- Check internet connection
- Verify cluster hostname
- Whitelist your IP in Atlas Network Access

### **Connection Refused**
- Check if MongoDB is running (local)
- Verify connection string format
- Check firewall settings

## 📝 **Important Notes**

1. **Never commit your `.env` file** to version control
2. **Use strong passwords** for database users
3. **Keep your connection string secure**
4. **The deprecated options have been removed** from the code 