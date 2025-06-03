window.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const questionsNav = document.getElementById('questionsNav');
    const testsNav = document.getElementById('testsNav');
    if (data.loggedIn) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = '';
      if (logoutBtn) {
        logoutBtn.onclick = async function() {
          await fetch('/auth/logout', { method: 'POST' });
          window.location.href = '/pages/login.html';
        };
      }
      if (data.user.role === 'student') {
        if (questionsNav) questionsNav.style.display = 'none';
        if (testsNav) testsNav.style.display = 'none';
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (questionsNav) questionsNav.style.display = '';
      if (testsNav) testsNav.style.display = '';
    }
  } catch (err) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const questionsNav = document.getElementById('questionsNav');
    const testsNav = document.getElementById('testsNav');
    if (loginBtn) loginBtn.style.display = '';
    if (registerBtn) registerBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (questionsNav) questionsNav.style.display = '';
    if (testsNav) testsNav.style.display = '';
  }
}); 