const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb+srv://testUser:Southeastern1!@cmps415db.bgdozem.mongodb.net/?retryWrites=true&w=majority&appName=cmps415db";

// Middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
let db;

MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error('Failed to connect to the database');
        return;
    }
    console.log('Connected to the database');
    db = client.db('gldb'); 
    // Routes should be defined inside this callback function to ensure db is defined
    // Default endpoint
    app.get('/', (req, res) => {
        if (req.cookies.auth) {
            res.send(`Authentication cookie exists: ${req.cookies.auth}`);
        } else {
            res.send(`
                <h1>Login/Register</h1>
                <form action="/login" method="post">
                    <input type="text" name="username" placeholder="Username" required><br>
                    <input type="password" name="password" placeholder="Password" required><br>
                    <button type="submit">Login</button>
                </form>
                <form action="/register" method="post">
                    <input type="text" name="username" placeholder="Desired Username" required><br>
                    <input type="password" name="password" placeholder="Desired Password" required><br>
                    <button type="submit">Register</button>
                </form>
            `);
        }
    });

    // Register endpoint
    app.post('/register', async (req, res) => {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('authentication').insertOne({ username, password: hashedPassword });
        res.redirect('/');
    });

    // Login endpoint
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = await db.collection('authentication').findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            const cookieOptions = {
                maxAge: 60000, // 1 minute expiration
                httpOnly: true,
                
            };
            res.cookie('auth', user._id, cookieOptions);
            res.send('Logged in successfully. Authentication cookie set.');
        } else {
            res.send('Invalid username or password. <a href="/">Back to Login/Register</a>');
        }
    });

    // Cookie reporting endpoint
    app.get('/cookies', (req, res) => {
        res.send(`Active cookies: ${JSON.stringify(req.cookies)}`);
    });

    // Cookie clearing endpoint
    app.get('/clear-cookies', (req, res) => {
        res.clearCookie('auth');
        res.send(`Cookies cleared. <a href="/">Back to Login/Register</a>`);
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
