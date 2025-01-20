import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

app.use(express.static('public'));
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});


app.post('/signup', async (req, res) => {
    const { nimi, email, parool } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(parool, 10);
        const query = 'INSERT INTO Kasutaja (Nimi, Email, Parool) VALUES (?, ?, ?)';
        db.query(query, [nimi, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user into database:', err);
                res.status(500).send('Error creating account');
                return;
            }
            res.redirect('/login.html');
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error creating account');
    }
});

app.get('/api/recipes/random', async (req, res) => {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=3&tags=main course`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

app.get('/api/recipes/:id', async (req, res) => {
    const recipeId = req.params.id;
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipe details' });
    }
});

app.get('/api/recipes/search', async (req, res) => {
    const query = req.query.query;
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${query}&number=3&addRecipeInformation=true`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search recipes' });
    }
});

app.post('/api/translate', express.json(), async (req, res) => {
    try {
        const { text, targetLang } = req.body;
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ q: text, target: targetLang }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to translate text' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(`${process.cwd()}/public/homepage.html`);
});

app.get('/recipes.html', (req, res) => {
    res.sendFile(`${process.cwd()}/public/recipes.html`);
})

app.get('/signup.html', (req, res) => {
    res.sendFile(`${process.cwd()}/public/signup.html`);
})

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});