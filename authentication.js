const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require("mongodb");

// MongoDB connection URI
const uri = "mongodb+srv://testUser:Southeastern1!@cmps415db.bgdozem.mongodb.net/?retryWrites=true&w=majority&appName=cmps415db";

// Create an Express app
const app = express();
const port = 3000;

// Start the server
app.listen(port, () => {
    console.log('Server started at http://localhost:' + port);
});

// Use middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB client
const client = new MongoClient(uri);

// Default route
app.get('/', function(req, res) {
    const authCookie = req.cookies.authCookie;
    if (authCookie) { 
        // If authentication cookie exists
        res.send(`
            <h1>Login successful</h1>
            <p>Cookie: ${authCookie}</p>
            <a href="/activecookies">Show Cookies</a>
        `);
    } else {
        // If authentication cookie doesn't exist
        const outstring = `
            <h1><i>Login</i></h1>
            <form action="/api/login" method="post">
                <input type="text" name="username" placeholder="Username" required><br>
                <input type="password" name="password" placeholder="Password" required><br><br>
                <button type="submit">Login</button>
            </form>
            <form action="/register" method="GET">
                <button type="submit">Register Now</button>
            </form>
        `;
        res.send(outstring);
    }
});

// Register route
app.get('/register', function(req, res) {
    const outstring = `
        <h1><i>Registration</i></h1>
        <form action="/insertregister" method="POST">
            <input type="text" name="username" placeholder="Username" required><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Register</button>
        </form>
    `;
    res.send(outstring);
});

// Insert register route
app.post('/insertregister', function(req, res) {
    async function run() {
        try {
            const database = client.db('gldb');
            const authCollection = database.collection('authentication');
    
            const doc = { [req.body.username]: req.body.password };
            const result = await authCollection.insertOne(doc);
            console.log(`New user registered with id ${result.insertedId}`);
            res.redirect('/');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error registering user');
        }
    }
    run().catch(console.dir);
});

// Active cookies route
app.get('/activecookies', function(req, res) {
    const cookies = req.cookies;
    let cookiesList = '<h1><i>Active Cookies:</i></h1><ul>';

    for (const [name, value] of Object.entries(cookies)) {
        cookiesList += `<li>${name}: ${value}</li>`;
    }

    cookiesList += '</ul>';
    cookiesList += '<form action="/clearcookies" method="POST"><button type="submit">Clear Cookies</button></form>';
    cookiesList += '<button onclick="window.location.href=\'/\'">Back to Home</button>';
    res.send(cookiesList);
});

// Clear cookies route
app.post('/clearcookies', function(req, res) {
    const tohome = `<a href="/">Back to Home</a>`;
    const tocookielist = `<a href="/activecookies">Show Cookies</a>`;
    var cookiename = req.body.username + "Cookie"
    res.clearCookie(cookiename);
    res.send(`${tohome}<br>${tocookielist}`); 
});

// API login route
app.post('/api/login', function(req, res) {
    async function run() {
        try {
            const database = client.db('gldb');
            const authCollection = database.collection('authentication');
            const query = { [req.body.username]: req.body.password };
            console.log("Looking for: " + query);
        
            const user = await authCollection.findOne(query);
            const tohome = `<a href="/">Back to Home</a>`;
            const tocookielist = `<a href="/activecookies">Show Cookies</a>`;
            if (user) {
                res.cookie(req.body.username + "Cookie", 'authenticated', { maxAge: 60000, httpOnly: true });
                
                res.send(`Cookie for `+ req.body.username + ` was set for 1 minute <br> ${tocookielist} <br> ${tohome}`);
            } else {
                res.status(401).send(`Invalid Username or Password <br> ${tocookielist} <br> ${tohome}`);
            }
        } finally {
            // Ensure that the client will close when you finish/error
            //await client.close();
        }
    }
    run().catch(console.dir);
});
