# Client Environment Setup Guide

## 🔧 Razorpay Frontend Configuration

### **Step 1: Create Client Environment File**

Create a `.env` file in the `client` directory:

```bash
# In the client directory
touch .env
```

### **Step 2: Add Your Razorpay Key**

Add your Razorpay key to `client/.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
```

**Important:** 
- Use `VITE_` prefix for Vite to expose the variable to the frontend
- Replace `rzp_test_YOUR_ACTUAL_KEY_ID` with your actual Razorpay test key

### **Step 3: Update the Frontend Code**

Update `client/src/pages/VendorDashboard.tsx` line 348:

```javascript
// Change this line:
key: 'rzp_test_YOUR_ACTUAL_KEY_ID',

// To this:
key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_ACTUAL_KEY_ID',
```

### **Step 4: Restart the Development Server**

```bash
# In the client directory
npm run dev
```

## 🔍 **Verification**

1. **Check the browser console** for any Razorpay-related errors
2. **Test the payment flow** - it should now work with your actual keys
3. **Verify the key is loaded** by checking `import.meta.env.VITE_RAZORPAY_KEY_ID` in the browser console

## 📝 **Important Notes**

- **Never commit your actual keys** to version control
- **Use test keys** for development
- **Use production keys** only in production environment
- **The server keys** (in `server/.env`) are different from the client key
- **Client only needs the public key** (`rzp_test_...`)
- **Server needs both public and secret keys**

## 🚀 **Next Steps**

After setting up the environment variables:

1. **Test the complete payment flow**
2. **Verify real-time order updates**
3. **Check payment confirmation emails** (if configured)
4. **Test with different order amounts**

## 🔒 **Security**

- ✅ **Client key is public** - safe to expose in frontend
- ✅ **Server secret key** - kept secure in backend
- ✅ **Payment verification** - handled securely on backend
- ✅ **Environment variables** - not committed to git 