// load navbar partial in every page
window.addEventListener('DOMContentLoaded', function() {
  const navbarDiv = document.getElementById('navbar');
  if (navbarDiv) {
    fetch('/partials/navbar.html')
      .then(res => res.text())
      .then(html => {
        navbarDiv.innerHTML = html;
        
        if (typeof setupNavbarAuth === 'function') setupNavbarAuth();
      });
  }
});

window.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const questionsNav = document.getElementById('questionsNav');
    const testsNav = document.getElementById('testsNav');
    const profileBtn = document.querySelector('a[href="/pages/profile.html"]');
    if (data.loggedIn) {
      if (profileBtn) profileBtn.style.display = '';
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
        if (questionsNav) questionsNav.remove();
        if (testsNav) testsNav.remove();
      }
    } else {
      if (profileBtn) profileBtn.style.display = 'none';
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (questionsNav) questionsNav.style.display = '';
      if (testsNav) testsNav.style.display = '';
    }

    if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/' || window.location.pathname === '/pages/') {
      if (!data.loggedIn || (data.user.role !== 'teacher' && data.user.role !== 'admin')) {
        if (questionsNav) questionsNav.style.display = 'none';
        if (testsNav) testsNav.style.display = 'none';
      } else {
        if (questionsNav) questionsNav.style.display = '';
        if (testsNav) testsNav.style.display = '';
      }
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