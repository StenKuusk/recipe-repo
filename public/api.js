// Lisab random retseptid avalehel
async function fetchRandomRecipes() {
    try {
        const loadingHTML = `
            <div class="loading-message">
                <p>Laen retsepte...</p>
            </div>
        `;
        document.querySelector('.recipes-grid').innerHTML = loadingHTML;

        const response = await fetch('/api/recipes/random');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayRecipes(data.recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        displayError('Vabandust, retseptide laadimisel tekkis viga. Palun proovi hiljem uuesti.');
    }
}

// Tõlgib retseptid eesti keelde
async function translateText(text, targetLang = 'et') {
    const response = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLang }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.data.translations[0].translatedText;
}

// Näitab retseptid
async function displayRecipes(recipes) {
    const recipesGrid = document.querySelector('.recipes-grid');
    recipesGrid.innerHTML = ''; 

    for (const recipe of recipes) {
        const translatedTitle = await translateText(recipe.title);
        const translatedDescription = await translateText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');

        const recipeCard = `
            <div class="recipe-card">
                <img src="${recipe.image}" alt="${translatedTitle}" onerror="this.src='https://via.placeholder.com/400x300?text=Pilt+pole+saadaval'">
                <div class="recipe-content">
                    <h3>${translatedTitle}</h3>
                    <p>${translatedDescription}</p>
                    <button class="recipe-button">Vaata retsepti</button>
                </div>
            </div>
        `;
        recipesGrid.innerHTML += recipeCard;
    }
}

// Retsepti otsing
async function handleSearch() {
    const searchTerm = document.querySelector('.search-container input').value;
    if (searchTerm.trim() !== '') {
        try {
            document.querySelector('.recipes-grid').innerHTML = '<div class="loading-message"><p>Otsin retsepte...</p></div>';

            const response = await fetch(`/api/recipes/search?query=${searchTerm}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.results.length === 0) {
                displayError('Otsingu tulemusi ei leitud. Proovi teisi märksõnu.');
                return;
            }

            displayRecipes(data.results);
        } catch (error) {
            console.error('Error searching recipes:', error);
            displayError('Vabandust, otsingul tekkis viga. Palun proovi hiljem uuesti.');
        }
    }
}

// Error kiri
function displayError(message) {
    const recipesGrid = document.querySelector('.recipes-grid');
    recipesGrid.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

// Event listeners
document.querySelector('.search-container button').addEventListener('click', handleSearch);
document.querySelector('.search-container input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Laeb random retseptid avalehele
document.addEventListener('DOMContentLoaded', fetchRandomRecipes);