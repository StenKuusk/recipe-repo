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
            await loadComments(recipeId);

            await fetch('/api/recipes/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipeId })
            });
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
        const addToFavoritesButton = document.createElement('button');
        addToFavoritesButton.textContent = 'Lisa retsept lemmikutesse';
        addToFavoritesButton.classList.add('add-to-favorites-button');
        addToFavoritesButton.addEventListener('click', () => addToFavorites(recipe.idMeal));
        instructionsList.appendChild(addToFavoritesButton);

        document.getElementById('add-comment-section').style.display = 'block';
        document.getElementById('submit-comment').addEventListener('click', () => addComment(recipe.idMeal));
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const ratingValue = star.getAttribute('data-value');
                document.querySelectorAll('.star').forEach(s => {
                    s.classList.remove('selected');
                    if (s.getAttribute('data-value') <= ratingValue) {
                        s.classList.add('selected');
                    }
                });
            });
        });
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

async function addComment(recipeId) {
    const userId = localStorage.getItem('userId') || null;
    const commentText = document.getElementById('comment-text').value;
    const rating = document.querySelector('.star.selected')?.getAttribute('data-value') || 0;

    if (!commentText.trim()) {
        alert('Kommentaar ei tohi olla tühi.');
        return;
    }

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, recipeId, commentText, rating })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Kommentaar lisatud.');
            document.getElementById('comment-text').value = '';
            document.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
            await loadComments(recipeId);
        } else {
            alert(`Viga: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Vabandust, kommentaari lisamisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

async function loadComments(recipeId) {
    try {
        const response = await fetch(`/api/comments/${recipeId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const comments = await response.json();
        const commentsSection = document.getElementById('comments-section');
        commentsSection.innerHTML = '';

        if (comments.length === 0) {
            commentsSection.innerHTML = '<p>Pole veel kommentaare</p>';
        } else {
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.classList.add('comment');
                commentElement.innerHTML = 
                    `<p><strong>${comment.username || 'Anonymous'}</strong>: ${comment.text}</p>
                    <div class="rating">${renderStars(comment.rating)}</div>`;
                commentsSection.appendChild(commentElement);
            });
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        displayError('Vabandust, kommentaaride laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

function displayError(message) {
    const recipeInfoSection = document.querySelector('.recipe-info-section');
    recipeInfoSection.innerHTML = 
        `<div class="error-message">
            <p>${message}</p>
        </div>`;
}

function updateNavBar() {
    const navButtons = document.getElementById('nav-buttons');
    const userId = localStorage.getItem('userId');

    if (navButtons) {
        if (userId) {
            navButtons.innerHTML = 
                `<a href="/" class="nav-button">Kodu</a>
                <a href="/recipes.html" class="nav-button">Retseptid</a>
                <a href="../Account_favorites/favorites.html" class="nav-button">Minu Retseptid</a>
                <a href="#" class="nav-button" id="logout-button">Logi välja</a>`;

            document.getElementById('logout-button').addEventListener('click', () => {
                localStorage.removeItem('userId');
                window.location.href = '/';
            });
        } else {
            navButtons.innerHTML = 
                `<a href="/" class="nav-button">Kodu</a>
                <a href="/recipes.html" class="nav-button">Retseptid</a>
                <a href="/login.html" class="nav-button">Logi Sisse</a>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavBar();
});