// load navbar partial in every page
window.addEventListener('DOMContentLoaded', function() {
  const navbarDiv = document.getElementById('navbar');
  if (navbarDiv) {
    fetch('/partials/navbar.html')
      .then(res => res.text())
      .then(html => {
        navbarDiv.innerHTML = html;
        // After the partial is loaded, get the status and set the buttons
        fetch('/auth/status', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            setNavbarState(data);
          })
          .catch(() => setNavbarState({ loggedIn: false }));
      });
  }
});

function setNavbarState({ loggedIn, user }) {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const questionsNav = document.getElementById('questionsNav');
  const testsNav = document.getElementById('testsNav');
  const profileBtn = document.querySelector('a[href="/pages/profile.html"]');
  const path = window.location.pathname;

  // Hide login/register on login and register pages (even if not logged in)
  const isAuthPage = path.endsWith('/login.html') || path.endsWith('/register.html');
  if (isAuthPage) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (questionsNav) questionsNav.style.display = 'none';
    if (testsNav) testsNav.style.display = 'none';
    return;
  }
  
  if (path.endsWith('/index.html')) {
    if (profileBtn) profileBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (questionsNav) questionsNav.style.display = 'none';
    if (testsNav) testsNav.style.display = 'none';
    return;
  }

  // If logged in – hide login/register EVERYWHERE
  if (loggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
  } else {
    // If not logged in – show login/register EVERYWHERE (except on login/register pages)
    if (loginBtn) loginBtn.style.display = '';
    if (registerBtn) registerBtn.style.display = '';
  }

  // Hide questions/tests nav on login/register pages
  if (isAuthPage) {
    if (questionsNav) questionsNav.style.display = 'none';
    if (testsNav) testsNav.style.display = 'none';
    return;
  }

  if (loggedIn) {
    if (profileBtn) profileBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = '';
    if (logoutBtn) {
      logoutBtn.onclick = async function() {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/pages/login.html';
      };
    }
    if (user && user.role_name === 'student') {
      if (questionsNav) questionsNav.remove();
      if (testsNav) testsNav.remove();
    }
  } else {
    if (profileBtn) profileBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (questionsNav) questionsNav.style.display = '';
    if (testsNav) testsNav.style.display = '';
  }

  // Hide questions/tests nav on index for non-teacher
  if (path.endsWith('/index.html') || path === '/' || path === '/pages/') {
    if (!loggedIn || (user && user.role_name !== 'teacher' && user.role_name !== 'admin')) {
      if (questionsNav) questionsNav.style.display = 'none';
      if (testsNav) testsNav.style.display = 'none';
    } else {
      if (questionsNav) questionsNav.style.display = '';
      if (testsNav) testsNav.style.display = '';
    }
  }

  // Show admin panel link only for admin
  let adminPanelLink = document.getElementById('adminPanelNav');
  if (!adminPanelLink) {
    const nav = document.querySelector('.navbar-nav.me-auto');
    if (nav) {
      adminPanelLink = document.createElement('li');
      adminPanelLink.className = 'nav-item';
      adminPanelLink.innerHTML = '<a class="nav-link" id="adminPanelNav" href="/pages/adminPanel.html">Админ панел</a>';
      nav.appendChild(adminPanelLink);
    }
  }
  if (user && user.role_name === 'admin') {
    if (adminPanelLink) adminPanelLink.style.display = '';
  } else {
    if (adminPanelLink) adminPanelLink.style.display = 'none';
  }
}