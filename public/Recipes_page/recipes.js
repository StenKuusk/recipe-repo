async function fetchRecipeById(id) {
    const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
}

async function fetchRecommendedRecipes() {
    try {
        const recipeIds = ['52772', '52768', '52787']; 
        const recipes = [];

        for (const id of recipeIds) {
            const recipe = await fetchRecipeById(id);
            if (recipe) {
                recipes.push(recipe);
            }
        }

        await displayRecipes(recipes, 'recommended-recipes-grid');
    } catch (error) {
        console.error('Error fetching recommended recipes:', error);
        displayError('Vabandust, soovitatud retseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function fetchRecipesByFilter(filterType, filterValue) {
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?${filterType}=${filterValue}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
}

async function fetchRecipesBySearch(query) {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
}

async function applySearchAndFilters() {
    const category = document.getElementById('category-filter').value;
    const ingredient = document.getElementById('ingredient-filter').value;
    const area = document.getElementById('area-filter').value;
    const searchQuery = document.getElementById('search-input').value.trim();

    let recipes = [];

    if (searchQuery) {
        const translatedQuery = await translateText(searchQuery, 'en');
        recipes = await fetchRecipesBySearch(translatedQuery);
        if (recipes.length > 0) {
            document.getElementById('recommended-section').style.display = 'none';
            document.getElementById('search-results-section').style.display = 'block';
            await displayRecipes(recipes, 'search-results-grid');
        } else {
            alert('Otsingutulemusi ei leitud.');
        }
    } else {
        document.getElementById('recommended-section').style.display = 'block';
        document.getElementById('search-results-section').style.display = 'none';

        if (category) {
            recipes = await fetchRecipesByFilter('c', category);
        } else if (ingredient) {
            recipes = await fetchRecipesByFilter('i', ingredient);
        } else if (area) {
            recipes = await fetchRecipesByFilter('a', area);
        }
        console.log('Filtered recipes:', recipes);
        await displayRecipes(recipes, 'recommended-recipes-grid');
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

async function initializePage() {
    await fetchRecommendedRecipes();

    document.getElementById('search-button').addEventListener('click', applySearchAndFilters);
    document.getElementById('apply-filters-button').addEventListener('click', applySearchAndFilters);
    document.querySelector('.page-search-container input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applySearchAndFilters();
    });
}

document.addEventListener('DOMContentLoaded', initializePage);