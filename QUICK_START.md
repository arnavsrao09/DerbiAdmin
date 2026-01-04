# Quick Start Guide

Get your admin dashboard up and running in minutes!

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Set Up MongoDB

Make sure MongoDB is running on your system. You can:
- Install MongoDB locally, or
- Use MongoDB Atlas (cloud) - get a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## Step 3: Configure Backend

1. Create a `.env` file in the `backend` folder:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/derbiadmin
   PORT=5000
   JWT_SECRET=your-secret-key-change-this
   ```

   For MongoDB Atlas, use:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/derbiadmin
   ```

## Step 4: Start Backend Server

```bash
cd backend
npm start
```

You should see: `Server is running on port 5000` and `MongoDB connected successfully`

## Step 5: (Optional) Seed Sample Data

To test the dashboard with sample data:

```bash
cd backend
npm run seed
```

This will create 30 sample form responses with different sectors.

## Step 6: Start Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port)

## Step 7: Login

1. Open your browser and go to `http://localhost:5173`
2. You'll be redirected to the login page
3. Use the default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Check "Remember me" if you want to stay logged in
5. Click "Sign In"

## Step 8: View Dashboard

Once logged in, you'll see:
- **Left Panel**: Pie chart showing sector distribution
- **Right Panel**: Statistics table with key metrics
- **Bottom**: Table with all form responses (50 per page)

## Next Steps

1. **Connect Google Forms**: See [GOOGLE_FORMS_INTEGRATION.md](./GOOGLE_FORMS_INTEGRATION.md) for instructions
2. **Change Admin Password**: Connect to MongoDB and update the admin user
3. **Customize**: Adjust field names and structure to match your Google Form

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists and has correct MongoDB URI
- Check if port 5000 is already in use

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` in frontend `.env` (if you created one)

### No data showing
- Run the seed script: `cd backend && npm run seed`
- Check MongoDB connection
- Verify data exists in MongoDB (use MongoDB Compass or similar tool)

### Login not working
- Default credentials are `admin`/`admin123`
- Check backend logs for errors
- Verify JWT_SECRET is set in `.env`

## Need Help?

Check the main [README.md](./README.md) for more detailed information.

