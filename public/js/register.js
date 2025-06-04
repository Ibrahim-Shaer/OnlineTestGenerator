document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Успешна регистрация!');
        setTimeout(() => {
          window.location.href = '/pages/profile.html';
        }, 1500);
      } else {
        document.getElementById('registerError').style.display = '';
        document.getElementById('registerError').textContent = data.message || 'Грешка при регистрация!';
      }
    } catch (err) {
      document.getElementById('registerError').style.display = '';
      document.getElementById('registerError').textContent = 'Грешка при връзка със сървъра.';
    }
  });
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2000);
  }
}); 