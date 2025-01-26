document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        displayError('Palun logi sisse, et näha oma lemmikretsepte.');
        return;
    }

    try {
        const response = await fetch(`/api/favorites/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const favoriteRecipes = await response.json();
        console.log('Favorite recipes:', favoriteRecipes); 
        displayFavoriteRecipes(favoriteRecipes);
    } catch (error) {
        console.error('Error fetching favorite recipes:', error);
        displayError('Vabandust, lemmikretseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
});

async function fetchRecipeDetails(recipeId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}

async function removeFavoriteRecipe(userId, recipeId) {
    try {
        const response = await fetch(`/api/favorites/${userId}/${recipeId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.message);
        const updatedResponse = await fetch(`/api/favorites/${userId}`);
        const updatedFavoriteRecipes = await updatedResponse.json();
        displayFavoriteRecipes(updatedFavoriteRecipes);
    } catch (error) {
        console.error('Error removing favorite recipe:', error);
        alert('Vabandust, retsepti eemaldamisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function displayFavoriteRecipes(recipes) {
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) {
        console.error('Favorites grid element not found');
        return;
    }
    favoritesGrid.innerHTML = '';

    if (recipes.length === 0) {
        favoritesGrid.innerHTML = '<p>Teil pole veel lemmikretsepte.</p>';
        return;
    }

    const userId = localStorage.getItem('userId');

    for (const recipe of recipes) {
        console.log('Fetching details for recipe:', recipe.idMeal);
        const recipeDetails = await fetchRecipeDetails(recipe.idMeal);
        if (recipeDetails) {
            console.log('Displaying recipe:', recipeDetails);
            const recipeCard = `
                <div class="recipe-card">
                    <button class="remove-button" onclick="removeFavoriteRecipe('${userId}', '${recipe.idMeal}')">X</button>
                    <img src="${recipeDetails.strMealThumb}" alt="${recipeDetails.strMeal}" onerror="this.src='https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'">
                    <div class="recipe-content">
                        <h3>${recipeDetails.strMeal}</h3>
                        <button class="recipe-button" onclick="window.location.href='/recipe_info/recipe_info.html?id=${recipe.idMeal}'">Vaata retsepti</button>
                    </div>
                </div>
            `;
            favoritesGrid.innerHTML += recipeCard;
        } else {
            console.error('Recipe details not found for ID:', recipe.idMeal);
        }
    }
}

function displayError(message) {
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) {
        console.error('Favorites grid element not found');
        return;
    }
    favoritesGrid.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavBar();
});