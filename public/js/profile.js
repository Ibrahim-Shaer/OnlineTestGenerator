document.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    const user = data.user;

    if (!data.loggedIn) {
      window.location.href = '/pages/login.html';
      return;
    }
    // Set avatar, username, role
    const avatar = user.avatar || '/images/default-avatar.png';
    document.getElementById('profileAvatar').src = avatar;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileRole').textContent = user.role;

    // Role buttons
    const roleButtons = document.getElementById('role-buttons');
    if (user.role === 'student') {
      roleButtons.innerHTML = `
        <a href="/pages/student-tests.html" class="btn btn-primary mt-2">Моите тестове</a>
      `;
    } else if (user.role === 'teacher' || user.role === 'admin') {
      roleButtons.innerHTML = `
        <a href="/pages/questions.html" class="btn btn-success mt-2 me-2">Създай въпрос</a>
        <a href="/pages/tests.html" class="btn btn-primary mt-2">Тестове</a>
      `;
    }

    //Avatar upload logic
    const avatarInput = document.getElementById('avatarInput');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarForm = document.getElementById('avatarForm');
    const alertBox = document.getElementById('alertBox');

    avatarUploadBtn.addEventListener('click', function() {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', function() {
      if (avatarInput.files.length > 0) {
        avatarForm.requestSubmit();
      }
    });

    avatarForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData();
      const file = avatarInput.files[0];
      if (!file) return;
      formData.append('avatar', file);

      alertBox.style.display = 'none';
      alertBox.innerHTML = '';

      try {
        const res = await fetch('/auth/upload-avatar', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();
        if (res.ok) {
          document.getElementById('profileAvatar').src = result.avatar + '?t=' + Date.now();
          alertBox.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert">Снимката е качена успешно!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
          alertBox.style.display = '';
        } else {
          alertBox.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert">${result.message || 'Грешка при качването'}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
          alertBox.style.display = '';
        }
      } catch (err) {
        alertBox.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert">Грешка при връзката със сървъра.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        alertBox.style.display = '';
      }
    });
  } catch (err) {
    console.error('Error loading profile:', err);
  }
});
