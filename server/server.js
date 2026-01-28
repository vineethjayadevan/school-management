const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'https://school-management-3ah63babo-vineeths-projects-c5f12fec.vercel.app',
        'https://mystemgps.com',
        'https://www.mystemgps.com',
        process.env.CLIENT_URL
    ].filter(Boolean), // Allow localhost, specific vercel app, and any env var override
    credentials: true
}));
app.use(express.json()); // Body parser for JSON data
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/academics', require('./routes/academicRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
