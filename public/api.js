async function fetchPopularRecipes() {
    try {
        const loadingHTML = `
            <div class="loading-message">
                <p>Laen populaarseid retsepte...</p>
            </div>
        `;
        document.querySelector('.recipes-grid').innerHTML = loadingHTML;

        const response = await fetch('/api/recipes/popular');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const recipes = await response.json();

        displayRecipes(recipes);
    } catch (error) {
        console.error('Error fetching popular recipes:', error);
        displayError('Vabandust, populaarsete retseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
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
        const translatedTitle = await translateText(recipe.Pealkiri);
        const translatedDescription = await translateText(recipe.Kirjeldus || 'Retsepti kirjeldus puudub.');

        const recipeCard = `
            <div class="recipe-card">
                <img src="${recipe.strMealThumb || 'https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'}" alt="${translatedTitle}" onerror="this.src='https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'">
                <div class="recipe-content">
                    <h3>${translatedTitle}</h3>
                    <button class="recipe-button" onclick="window.location.href='/recipe_info/recipe_info.html?id=${recipe.Retsept_ID}'">Vaata retsepti</button>
                </div>
            </div>
        `;
        recipesGrid.innerHTML += recipeCard;
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
    fetchPopularRecipes();
    updateNavBar();
});
