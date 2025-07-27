# 🚀 SupplyLink - Real-Time Supplier-Vendor Platform

A comprehensive MERN stack platform connecting vendors with suppliers for raw materials procurement, featuring real-time communication, location-based filtering, voice search, and order management.

## ✨ Features

### 🌐 Vendor Dashboard
- **Voice-Based Search**: Web Speech API for hands-free material queries
- **Location-Aware Filtering**: Find suppliers within 10km radius using Haversine formula
- **Real-Time Notifications**: Socket.IO for instant order updates
- **Order Management**: Complete order lifecycle from request to delivery
- **Payment Integration**: Multiple payment methods support
- **Review System**: Rate and review suppliers after delivery

### 🛠️ Supplier Dashboard
- **Material Management**: Add, update, delete raw materials with pricing
- **Order Processing**: Real-time order requests with approve/reject functionality
- **Location Services**: Automatic geolocation storage and updates
- **Inventory Tracking**: Real-time stock management
- **Dispatch Management**: Track order status and delivery

### 🔧 Technical Features
- **Real-Time Communication**: Socket.IO for live updates
- **Location Services**: OpenStreetMap integration with geocoding
- **Voice Recognition**: Web Speech API for voice search
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **Authentication**: Firebase Auth with role-based access
- **Database**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **Firebase Admin SDK** for authentication
- **OpenStreetMap** for geocoding (proxy implementation)

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Socket.IO Client** for real-time features
- **Web Speech API** for voice search

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Firebase project with Authentication enabled

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SupplyLink
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create `.env` file in `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/supplylink
# or your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/supplylink

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Client URL for CORS
CLIENT_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create `.env` file in `client/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000

# Firebase Config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Start Development Servers

**Backend:**
```bash
cd server
npm run dev
# Server will start on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm run dev
# App will start on http://localhost:5173
```

## 🗂️ Project Structure

```
SupplyLink/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── middleware/         # Custom middleware
└── README.md
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile

### Vendors
- `POST /api/vendors/search` - Search suppliers
- `GET /api/vendors/orders` - Get order history
- `POST /api/vendors/orders` - Place order
- `PATCH /api/vendors/orders/:id/payment` - Make payment
- `PATCH /api/vendors/location` - Update location

### Suppliers
- `GET /api/suppliers/materials` - Get materials
- `POST /api/suppliers/materials` - Add material
- `PUT /api/suppliers/materials/:id` - Update material
- `DELETE /api/suppliers/materials/:id` - Delete material
- `GET /api/suppliers/orders` - Get orders
- `PATCH /api/suppliers/orders/:id/approve` - Approve order
- `PATCH /api/suppliers/orders/:id/reject` - Reject order
- `PATCH /api/suppliers/orders/:id/dispatch` - Dispatch order
- `PATCH /api/suppliers/orders/:id/deliver` - Mark as delivered

### Reviews
- `POST /api/reviews` - Submit review
- `GET /api/reviews/supplier/:id` - Get supplier reviews
- `GET /api/reviews/vendor` - Get vendor's reviews

### Geocoding
- `GET /api/geocode/reverse` - Reverse geocoding (proxy to OpenStreetMap)

## 🔌 Socket.IO Events

### Order Events
- `order_request_sent` - New order request
- `order_approved` - Order approved by supplier
- `order_rejected` - Order rejected by supplier
- `payment_made` - Payment completed
- `order_dispatched` - Order dispatched
- `order_delivered` - Order delivered

## 🎯 Usage Guide

### For Vendors
1. **Register/Login** with vendor role
2. **Set Location** - Allow location access for nearby supplier filtering
3. **Search Materials** - Use voice or text search for raw materials
4. **Browse Suppliers** - View verified suppliers within 10km radius
5. **Add to Cart** - Select materials and quantities
6. **Place Order** - Submit order request to supplier
7. **Track Progress** - Monitor order status in real-time
8. **Make Payment** - Complete payment when order is approved
9. **Review Supplier** - Rate and review after delivery

### For Suppliers
1. **Register/Login** with supplier role
2. **Set Location** - Allow location access for vendor discovery
3. **Add Materials** - List available raw materials with pricing
4. **Manage Inventory** - Update quantities and availability
5. **Process Orders** - Review and approve/reject incoming orders
6. **Dispatch Orders** - Mark orders as dispatched after payment
7. **Track Delivery** - Update order status to delivered

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase admin private key
- `FIREBASE_CLIENT_EMAIL` - Firebase admin client email
- `CLIENT_URL` - Frontend URL for CORS

**Frontend (.env)**
- `VITE_API_URL` - Backend API URL
- `VITE_SERVER_URL` - Socket.IO server URL
- `VITE_FIREBASE_*` - Firebase configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password, Google)
3. Create a service account and download credentials
4. Add Firebase config to frontend .env
5. Add Firebase admin credentials to backend .env

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like:
   - Heroku
   - Railway
   - Render
   - DigitalOcean

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy to platforms like:
   - Vercel
   - Netlify
   - Firebase Hosting
   - GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Advanced search filters
- [ ] Supplier verification system
- [ ] Order tracking with GPS
- [ ] Multi-language support
- [ ] Advanced reporting features

---

**Built with ❤️ using MERN stack, Socket.IO, and modern web technologies.** 