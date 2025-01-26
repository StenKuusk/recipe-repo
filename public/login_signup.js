document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(signupForm);
            const data = {
                nimi: formData.get('nimi'),
                email: formData.get('email'),
                parool: formData.get('parool')
            };

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const responseData = await response.json();
                if (response.ok) {
                    localStorage.setItem('userId', responseData.userId);
                    alert('Konto loomine õnnestus');
                    window.location.href = '/login.html';
                } else {
                    alert(`Error: ${responseData.message}`);
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert('Vabandust, konto loomisel tekkis viga. Palun proovi hiljem uuesti.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const data = {
                identifier: formData.get('identifier'),
                password: formData.get('password')
            };

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const responseData = await response.json();
                if (response.ok) {
                    localStorage.setItem('userId', responseData.userId);
                    alert('Sisselogimine õnnestus');
                    window.location.href = '/homepage.html';
                } else {
                    alert(`Error: ${responseData.message}`);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('Vabandust, sisselogimisel tekkis viga. Palun proovi hiljem uuesti.');
            }
        });
    }

    // Konto view
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

    updateNavBar();

    window.addEventListener('load', updateNavBar);
});