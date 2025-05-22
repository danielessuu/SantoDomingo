document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://santodomingo.onrender.com/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.access);
                window.location.href = './gestion.html';
            } else {
                alert('Credenciales inválidas. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error al iniciar sesión. Verifica tu conexión e intenta nuevamente.');
        }
    });
});