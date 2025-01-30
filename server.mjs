import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();

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
            const userId = result.insertId;
            res.json({ userId, message: 'Account created successfully' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error creating account');
    }
});

app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    const query = 'SELECT * FROM Kasutaja WHERE Email = ? OR Nimi = ?';
    db.query(query, [identifier, identifier], async (err, results) => {
        if (err) {
            console.error('Error fetching user from database:', err);
            res.status(500).json({ message: 'Error logging in' });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({ message: 'Valed andmed' });
            return;
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.Parool);

        if (match) {
            res.json({ userId: user.Kasutaja_ID, message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Valed andmed' });
        }
    });
});

app.get('/api/recipes/save', async (req, res) => {
    try {
        const recipes = [];
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of letters) {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
            const data = await response.json();
            if (data.meals) {
                recipes.push(...data.meals);
            }
        }

        for (const recipe of recipes) {
            const { idMeal, strMeal, strInstructions } = recipe;
            const query = 'INSERT IGNORE INTO Retseptid (Retsept_ID, Pealkiri, Kirjeldus) VALUES (?, ?, ?)';
            db.query(query, [idMeal, strMeal, strInstructions], (err) => {
                if (err) {
                    console.error('Error saving recipe to database:', err);
                }
            });
        }

        res.json({ message: 'Recipes saved successfully' });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Error saving recipes' });
    }
});

app.post('/api/favorites', async (req, res) => {
    const { userId, recipeId } = req.body;

    const query = 'INSERT INTO Lemmik_Retseptid (Kasutaja_ID, Retsept_ID) VALUES (?, ?)';
    db.query(query, [userId, recipeId], (err) => {
        if (err) {
            console.error('Error saving favorite recipe:', err);
            res.status(500).json({ message: 'Error saving favorite recipe' });
            return;
        }

        res.json({ message: 'Favorite recipe saved successfully' });
    });
});

app.get('/api/favorites/:userId', async (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT r.Retsept_ID as idMeal, r.Pealkiri as strMeal, r.Kirjeldus as strInstructions
        FROM Lemmik_Retseptid lr
        JOIN Retseptid r ON lr.Retsept_ID = r.Retsept_ID
        WHERE lr.Kasutaja_ID = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching favorite recipes:', err);
            res.status(500).json({ message: 'Error fetching favorite recipes' });
            return;
        }

        res.json(results);
    });
});

app.delete('/api/favorites/:userId/:recipeId', async (req, res) => {
    const { userId, recipeId } = req.params;

    const query = 'DELETE FROM Lemmik_Retseptid WHERE Kasutaja_ID = ? AND Retsept_ID = ?';
    db.query(query, [userId, recipeId], (err) => {
        if (err) {
            console.error('Error removing favorite recipe:', err);
            res.status(500).json({ message: 'Error removing favorite recipe' });
            return;
        }

        res.json({ message: 'Lemmik retsept eemaldatud õnnestus' });
    });
});


app.get('/api/recipes/search', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        const data = await response.json();
        res.json({ results: data.meals });
    } catch (error) {
        res.status(500).json({ error: 'Retseptide otsimine ebaõnnestus' });
    }
});

app.post('/api/comments', async (req, res) => {
    const { userId, recipeId, commentText, rating } = req.body;
    const query = 'INSERT INTO Kommentaarid (Kasutaja_ID, Retsept_ID, Kommentaar, Hinne) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, recipeId, commentText, rating], (err) => {
        if (err) {
            console.error('Error saving comment:', err);
            res.status(500).json({ message: 'Error saving comment' });
            return;
        }
        res.json({ message: 'Comment saved successfully' });
    });
});

app.get('/api/comments/:recipeId', async (req, res) => {
    const { recipeId } = req.params;
    const query = `
        SELECT k.Kommentaar as text, COALESCE(u.Nimi, 'Anonymous') as username, k.Hinne as rating
        FROM Kommentaarid k
        LEFT JOIN Kasutaja u ON k.Kasutaja_ID = u.Kasutaja_ID
        WHERE k.Retsept_ID = ?
    `;
    db.query(query, [recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            res.status(500).json({ message: 'Error fetching comments' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/recipes/view', async (req, res) => {
    const { recipeId } = req.body;
    const query = 'UPDATE Retseptid SET Vaatamised = Vaatamised + 1 WHERE Retsept_ID = ?';
    db.query(query, [recipeId], (err) => {
        if (err) {
            console.error('Error updating recipe views:', err);
            res.status(500).json({ message: 'Error updating recipe views' });
            return;
        }
        res.json({ message: 'Recipe view updated successfully' });
    });
});

app.get('/api/recipes/popular', async (req, res) => {
    const query = 'SELECT * FROM Retseptid ORDER BY Vaatamised DESC LIMIT 3';
    db.query(query, async (err, results) => {
        if (err) {
            console.error('Error fetching popular recipes:', err);
            res.status(500).json({ message: 'Error fetching popular recipes' });
            return;
        }

        const recipesWithImages = await Promise.all(results.map(async (recipe) => {
            const imageResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.Retsept_ID}`);
            const imageData = await imageResponse.json();
            if (imageData.meals && imageData.meals.length > 0) {
                recipe.strMealThumb = imageData.meals[0].strMealThumb;
            } else {
                recipe.strMealThumb = 'https://via.placeholder.com/400x300?text=Pilt+pole+saadaval';
            }
            return recipe;
        }));

        res.json(recipesWithImages);
    });
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
    res.sendFile(`${process.cwd()}/public/Recipes_page/recipes.html`);
});

app.get('/signup.html', (req, res) => {
    res.sendFile(`${process.cwd()}/public/signup.html`);
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});