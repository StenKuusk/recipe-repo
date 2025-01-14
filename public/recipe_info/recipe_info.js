document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (recipeId) {
        try {
            const response = await fetch(`/api/recipes/${recipeId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const recipe = await response.json();
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
    const translatedTitle = await translateText(recipe.title);
    document.getElementById('recipe-title').textContent = translatedTitle;
    document.getElementById('recipe-image').src = recipe.image;
    document.getElementById('recipe-image').alt = translatedTitle;

    const ingredientsList = document.getElementById('recipe-ingredients');
    for (const ingredient of recipe.extendedIngredients) {
        const translatedIngredient = await translateText(ingredient.original);
        const li = document.createElement('li');
        li.textContent = translatedIngredient;
        ingredientsList.appendChild(li);
    }

    const instructionsList = document.getElementById('recipe-instructions');
    for (const step of recipe.analyzedInstructions[0].steps) {
        const translatedStep = await translateText(step.step);
        const li = document.createElement('li');
        li.textContent = translatedStep;
        instructionsList.appendChild(li);
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