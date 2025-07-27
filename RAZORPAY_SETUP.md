# Razorpay Payment Gateway Setup Guide

## 🔑 Environment Variables Setup

Add these variables to your `server/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

## 🔧 Configuration Steps

### 1. Get Your Razorpay Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate a new key pair
4. Copy the Key ID and Key Secret

### 2. Update Configuration Files

#### Backend (`server/config/razorpay.js`):
```javascript
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

#### Frontend (`client/src/pages/VendorDashboard.tsx`):
```javascript
const options = {
  key: 'rzp_test_YOUR_KEY_ID', // Replace with your actual key
  // ... other options
};
```

### 3. Test Mode vs Live Mode
- **Test Mode**: Use `rzp_test_` keys for development
- **Live Mode**: Use `rzp_live_` keys for production

## 🧪 Testing the Integration

### Test Card Details:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

### Test UPI:
- **UPI ID**: success@razorpay

## 🔒 Security Notes

1. **Never commit your keys** to version control
2. **Use environment variables** for all sensitive data
3. **Verify payment signatures** on the backend
4. **Use HTTPS** in production

## 📱 Payment Flow

1. Vendor clicks "Proceed to Payment"
2. Backend creates Razorpay order
3. Frontend opens Razorpay checkout
4. User completes payment
5. Backend verifies payment signature
6. Order status updated to "paid"
7. Real-time notifications sent

## 🚀 Production Checklist

- [ ] Replace test keys with live keys
- [ ] Update frontend key to live key
- [ ] Enable HTTPS
- [ ] Test payment flow end-to-end
- [ ] Monitor payment logs
- [ ] Set up webhook handling (optional) 