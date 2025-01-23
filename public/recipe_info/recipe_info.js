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
    } catch (error) {
        console.error('Error displaying recipe:', error);
        displayError('Vabandust, retsepti kuvamisel tekkis viga. Palun proovi hiljem uuesti.');
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