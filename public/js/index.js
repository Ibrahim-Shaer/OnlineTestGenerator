
window.addEventListener('DOMContentLoaded', function() {
  fetch('/auth/status', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        const loginMainBtn = document.getElementById('loginMainBtn');
        const registerMainBtn = document.getElementById('registerMainBtn');

        if (loginMainBtn) loginMainBtn.style.display = 'none';
        if (registerMainBtn) registerMainBtn.style.display = 'none';
      }
    })
    .catch(() => {
      //If there is an error, do nothing — the user is not logged in
    });
});
