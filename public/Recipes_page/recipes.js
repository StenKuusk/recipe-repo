async function fetchRandomRecipes() {
    try {
        const loadingHTML = `
            <div class="loading-message">
                <p>Laen retsepte...</p>
            </div>
        `;
        document.getElementById('random-recipes-grid').innerHTML = loadingHTML;

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

        displayRecipes(recipes, 'random-recipes-grid');
    } catch (error) {
        console.error('Error fetching recipes:', error);
        displayError('Vabandust, retseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function searchRecipes(filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            query: filters.searchTerm || '',
            category: filters.category || '',
            time: filters.time || '',
            difficulty: filters.difficulty || ''
        });

        const response = await fetch(`/api/recipes/search?${queryParams}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error searching recipes:', error);
        return [];
    }
}

async function translateText(text, targetLang = 'et') {
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            body: JSON.stringify({ text, targetLang }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

async function displayRecipes(recipes, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (const recipe of recipes) {
        const translatedTitle = await translateText(recipe.strMeal);
        const translatedDescription = await translateText(recipe.strInstructions || 'Retsepti kirjeldus puudub.');
        
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${translatedTitle}" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'">
            <div class="recipe-content">
                <h3>${translatedTitle}</h3>
                <button class="recipe-button" onclick="window.location.href='/recipe_info/recipe_info.html?id=${recipe.idMeal}'">
                    Vaata retsepti
                </button>
            </div>
        `;
        container.appendChild(recipeCard);
    }
}

async function handleSearch() {
    const searchTerm = document.querySelector('.search-container input').value;
    const category = document.getElementById('category-filter').value;
    const time = document.getElementById('time-filter').value;
    const difficulty = document.getElementById('difficulty-filter').value;

    const filters = {
        searchTerm,
        category,
        time,
        difficulty
    };

    const results = await searchRecipes(filters);
    await displayRecipes(results, 'random-recipes-grid');
}

async function initializePage() {
    const randomRecipes = await fetchRandomRecipes();

    await displayRecipes(randomRecipes, 'random-recipes-grid');

    document.querySelector('.page-search-container button').addEventListener('click', handleSearch);
    document.querySelector('.page-search-container input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('apply-filters-button').addEventListener('click', handleSearch);
    ['category-filter', 'time-filter', 'difficulty-filter'].forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', handleSearch);
    });
}

document.addEventListener('DOMContentLoaded', initializePage);