# SkillSwap

A MERN stack web platform designed to facilitate collaborative learning and skill development through peer-to-peer guidance. The platform emphasizes reciprocal knowledge exchange, industrial-grade security features, and user-friendly interfaces to create a dynamic learning environment.

## 🚀 Features

- **Peer-to-Peer Learning**: Connect with others to exchange skills and knowledge
- **Real-time Chat**: Built-in messaging system for direct communication
- **User Authentication**: Secure login/register with JWT tokens
- **Profile Management**: Create and manage your skill profile
- **Skill Discovery**: Search and discover users with specific skills
- **Rating System**: Rate and review learning sessions
- **Responsive Design**: Works seamlessly across all devices

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- React Bootstrap
- Axios
- Socket.io-client
- React Toastify

### Backend
- Node.js
- Express.js
- MongoDB (MongoDB Atlas)
- Mongoose
- Socket.io
- JWT Authentication
- Passport.js (Google OAuth)
- Multer (File uploads)
- Nodemailer

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Google Cloud Console (for OAuth)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
npm install
```

2. Create a `.env` file in the Backend directory:
```env
PORT=8000
CORS_ORIGIN=*
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
JWT_SECRET=your_jwt_secret
EMAIL_ID=your_email
APP_PASSWORD=your_app_password
```

3. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
npm install
```

2. Create a `.env` file in the Frontend directory:
```env
VITE_LOCALHOST=http://localhost:8000
VITE_SERVER_URL=your_deployment_url
```

3. Start the frontend development server:
```bash
npm run dev
```

## 🚀 Usage

1. Open your browser and go to `http://localhost:5173`
2. Register a new account or login with existing credentials
3. Create your profile with your skills and interests
4. Discover other users and connect with them
5. Start learning and sharing skills!

## 📁 Project Structure

```
SkillSwap/
├── Backend/
│   ├── src/
│   │   ├── config/          # Database and cloudinary config
│   │   ├── controllers/     # API controllers
│   │   ├── middlewares/     # JWT and multer middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── app.js           # Express app setup
│   │   └── index.js         # Server entry point
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── Components/      # Reusable components
│   │   ├── Pages/           # Page components
│   │   ├── util/            # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # React entry point
│   └── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React.js community
- MongoDB Atlas for database hosting
- Google Cloud Console for OAuth integration

