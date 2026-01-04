# DerbiAdmin - Admin Dashboard

An admin dashboard for viewing and managing Google Form responses with sector-based analytics.

## Features

- 🔐 Single admin authentication with "Remember Me" functionality
- 📊 Interactive pie chart showing sector distribution
- 📋 Paginated table view (50 responses per page)
- 📥 Export responses to Excel (XLS)
- 📎 Download uploaded documents list
- 📈 Real-time statistics overview

## Tech Stack

- **Frontend**: React (JavaScript) + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Charts**: Recharts
- **Authentication**: JWT

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/derbiadmin
   PORT=5000
   JWT_SECRET=your-secret-key-here
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional, for custom API URL):
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these credentials immediately in production! You can do this by:
1. Connecting to MongoDB
2. Finding the Admin collection
3. Updating the admin user's password (it will be automatically hashed)

## Google Forms Integration

See [GOOGLE_FORMS_INTEGRATION.md](./GOOGLE_FORMS_INTEGRATION.md) for detailed instructions on connecting your Google Form to this dashboard.

## Project Structure

```
DerbiAdmin/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # React components
│   │   ├── context/     # React context (Auth)
│   │   └── styles/      # CSS files
│   └── public/          # Static assets
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Responses
- `GET /api/responses` - Get paginated responses
- `GET /api/responses/:id` - Get single response
- `POST /api/responses` - Create new response (for Google Forms)

### Statistics
- `GET /api/stats/sector-distribution` - Get sector distribution for pie chart
- `GET /api/stats/overview` - Get overview statistics

### Export
- `GET /api/export/xls` - Export responses to Excel
- `GET /api/export/download-docs` - Download uploaded documents list

## Development

### Backend
```bash
cd backend
npm start          # Production mode
npm run dev        # Development mode with auto-reload
```

### Frontend
```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## Production Deployment

1. **Backend**:
   - Set environment variables in production
   - Use a strong JWT_SECRET
   - Enable HTTPS
   - Update MongoDB connection string

2. **Frontend**:
   - Build the project: `npm run build`
   - Serve the `dist` folder using a web server (nginx, Apache, etc.)
   - Update `VITE_API_BASE_URL` to point to your production backend

3. **Security**:
   - Change default admin credentials
   - Use environment variables for sensitive data
   - Enable CORS only for your frontend domain
   - Use HTTPS in production

## Troubleshooting

- **MongoDB connection issues**: Ensure MongoDB is running and the connection string is correct
- **CORS errors**: Check backend CORS configuration
- **Authentication issues**: Verify JWT_SECRET is set correctly
- **File uploads not showing**: Check Google Forms integration and file storage configuration

## License

ISC

