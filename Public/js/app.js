document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const lrn = document.getElementById('lrn').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lrn, password, role })
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            alert('Login failed. Check your credentials.');
        }
    })
    .catch((error) => console.error('Error:', error));
});
