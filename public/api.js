async function fetchRandomRecipes() {
    try {
        const loadingHTML = `
            <div class="loading-message">
                <p>Laen retsepte...</p>
            </div>
        `;
        document.querySelector('.recipes-grid').innerHTML = loadingHTML;

        const recipes = [];
        for (let i = 0; i < 3; i++) {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.meals) {
                recipes.push(data.meals[0]);
            }
        }

        displayRecipes(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        displayError('Vabandust, retseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function saveRecipesToDatabase() {
    try {
        const response = await fetch('/api/recipes/save');
        const data = await response.json();
        if (response.ok) {
            console.log('Recipes saved successfully:', data.message);
        } else {
            console.error('Error saving recipes:', data.message);
        }
    } catch (error) {
        console.error('Error saving recipes:', error);
    }
}

async function translateText(text, targetLang = 'et') {
    const response = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLang }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.data.translations[0].translatedText;
}

async function displayRecipes(recipes) {
    const recipesGrid = document.querySelector('.recipes-grid');
    recipesGrid.innerHTML = ''; 

    for (const recipe of recipes) {
        const translatedTitle = await translateText(recipe.strMeal);
        const translatedDescription = await translateText(recipe.strInstructions || 'Retsepti kirjeldus puudub.');

        const recipeCard = `
            <div class="recipe-card">
                <img src="${recipe.strMealThumb}" alt="${translatedTitle}" onerror="this.src='https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'">
                <div class="recipe-content">
                    <h3>${translatedTitle}</h3>
                    <button class="recipe-button" onclick="window.location.href='/recipe_info/recipe_info.html?id=${recipe.idMeal}'">Vaata retsepti</button>
                </div>
            </div>
        `;
        recipesGrid.innerHTML += recipeCard;
    }
}

async function handleSearch() {
    const searchTerm = document.querySelector('.search-container input').value;
    if (searchTerm.trim() !== '') {
        try {
            document.querySelector('.recipes-grid').innerHTML = '<div class="loading-message"><p>Otsin retsepte...</p></div>';

            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.meals) {
                displayError('Otsingu tulemusi ei leitud. Proovi teisi märksõnu.');
                return;
            }

            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error searching recipes:', error);
            displayError('Vabandust, otsingul tekkis viga. Palun proovi hiljem uuesti.');
        }
    }
}

function displayError(message) {
    const recipesGrid = document.querySelector('.recipes-grid');
    recipesGrid.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

function updateNavBar() {
    const navButtons = document.getElementById('nav-buttons');
    const userId = localStorage.getItem('userId');

    if (navButtons) {
        if (userId) {
            navButtons.innerHTML = `
                <a href="/" class="nav-button">Kodu</a>
                <a href="/recipes.html" class="nav-button">Retseptid</a>
                <a href="../Account_favorites/favorites.html" class="nav-button">Minu Retseptid</a>
                <a href="#" class="nav-button" id="logout-button">Logi välja</a>
            `;

            document.getElementById('logout-button').addEventListener('click', () => {
                localStorage.removeItem('userId');
                window.location.href = '/';
            });
        } else {
            navButtons.innerHTML = `
                <a href="/" class="nav-button">Kodu</a>
                <a href="/recipes.html" class="nav-button">Retseptid</a>
                <a href="/login.html" class="nav-button">Logi Sisse</a>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRandomRecipes();
    updateNavBar();
});

document.querySelector('.search-container button').addEventListener('click', handleSearch);
document.querySelector('.search-container input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});