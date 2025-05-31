window.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();

    // Показване/скриване на бутони според логване
    if (data.loggedIn) {
      const loginLink = document.getElementById('loginLink');
      const registerLink = document.getElementById('registerLink');
      const logoutLink = document.getElementById('logoutLink');
      const profileLink = document.getElementById('profileLink');
      const adminLink = document.getElementById('adminLink');
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = '';
      if (profileLink) profileLink.style.display = '';
      if (adminLink) adminLink.style.display = (data.user.role === 'admin') ? '' : 'none';
    } else {
      const loginLink = document.getElementById('loginLink');
      const registerLink = document.getElementById('registerLink');
      const logoutLink = document.getElementById('logoutLink');
      const profileLink = document.getElementById('profileLink');
      const adminLink = document.getElementById('adminLink');
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
      if (logoutLink) logoutLink.style.display = 'none';
      if (profileLink) profileLink.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  } catch (err) {
    // Ако има грешка, показвай login/register
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const profileLink = document.getElementById('profileLink');
    const adminLink = document.getElementById('adminLink');
    if (loginLink) loginLink.style.display = '';
    if (registerLink) registerLink.style.display = '';
    if (logoutLink) logoutLink.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}); 