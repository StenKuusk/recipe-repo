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

                if (response.ok) {
                    window.location.href = '/login.html';
                } else {
                    const errorText = await response.text();
                    alert(`Error: ${errorText}`);
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

                if (response.ok) {
                    window.location.href = '/recipes.html';
                } else {
                    const errorText = await response.text();
                    alert(`Error: ${errorText}`);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('Vabandust, sisselogimisel tekkis viga. Palun proovi hiljem uuesti.');
            }
        });
    }
});