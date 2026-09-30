document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    errorMessage.style.display = 'none';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Store user session details in browser storage
            localStorage.setItem('currentUser', JSON.stringify(data));
            
            // Redirect user to main dashboard page
            window.location.href = '/pages/dashboard.html';
        } else {
            const errorText = await response.text();
            errorMessage.textContent = errorText || 'Invalid credentials';
            errorMessage.style.display = 'block';
        }
    } catch (err) {
        errorMessage.textContent = 'Server connection error. Please try again.';
        errorMessage.style.display = 'block';
    }
});