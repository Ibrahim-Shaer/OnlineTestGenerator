document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/pages/profile.html';
      } else {
        document.getElementById('loginError').style.display = '';
        document.getElementById('loginError').textContent = data.message || 'Грешен имейл или парола!';
      }
    } catch (err) {
      document.getElementById('loginError').style.display = '';
      document.getElementById('loginError').textContent = 'Грешка при връзка със сървъра.';
    }
  });
}); 