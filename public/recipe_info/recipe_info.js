document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (recipeId) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.meals || data.meals.length === 0) {
                throw new Error('Recipe not found');
            }

            const recipe = data.meals[0];
            await displayRecipe(recipe);
        } catch (error) {
            console.error('Error fetching recipe:', error);
            displayError('Vabandust, retsepti laadimisel tekkis viga. Palun proovi hiljem uuesti.');
        }
    } else {
        displayError('Retsepti ID puudub.');
    }
});

async function translateText(text, targetLang = 'et') {
    const response = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLang }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.data.translations[0].translatedText;
}

async function displayRecipe(recipe) {
    try {
        const translatedTitle = await translateText(recipe.strMeal);
        document.getElementById('recipe-title').textContent = translatedTitle;
        document.getElementById('recipe-image').src = recipe.strMealThumb;
        document.getElementById('recipe-image').alt = translatedTitle;

        const ingredientsList = document.getElementById('recipe-ingredients');
        ingredientsList.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                const translatedIngredient = await translateText(`${measure} ${ingredient}`);
                const li = document.createElement('li');
                li.textContent = translatedIngredient;
                ingredientsList.appendChild(li);
            }
        }

        const instructions = recipe.strInstructions.split('\n').filter(step => step.trim() !== '');
        const instructionsList = document.getElementById('recipe-instructions');
        instructionsList.innerHTML = '';
        for (const step of instructions) {
            const translatedStep = await translateText(step);
            const li = document.createElement('li');
            li.textContent = translatedStep;
            instructionsList.appendChild(li);
        }

        const userId = localStorage.getItem('userId');
        if (userId) {
            const addToFavoritesButton = document.createElement('button');
            addToFavoritesButton.textContent = 'Lisa lemmikutesse';
            addToFavoritesButton.classList.add('add-to-favorites-button');
            addToFavoritesButton.addEventListener('click', () => addToFavorites(recipe.idMeal));
            document.querySelector('.recipe-info-section').appendChild(addToFavoritesButton);
        }
    } catch (error) {
        console.error('Error displaying recipe:', error);
        displayError('Vabandust, retsepti kuvamisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function addToFavorites(recipeId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Palun logi sisse, et lisada retsepte lemmikutesse.');
        return;
    }

    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, recipeId })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Retsept lisatud lemmikutesse.');
        } else {
            alert(`Viga: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding recipe to favorites:', error);
        alert('Vabandust, retsepti lisamisel lemmikutesse tekkis viga. Palun proovi hiljem uuesti.');
    }
}

function displayError(message) {
    const recipeInfoSection = document.querySelector('.recipe-info-section');
    recipeInfoSection.innerHTML = `
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
    updateNavBar();
});