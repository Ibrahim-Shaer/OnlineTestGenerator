document.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/auth/status', { credentials: 'include' });
    const data = await response.json();
    const user = data.user;
    console.log('user:', user);

    if (!data.loggedIn) {
      window.location.href = '/pages/login.html';
      return;
    }
    // Set avatar, username, role
    const avatar = user.avatar || '/images/default-avatar.png';
    document.getElementById('profileAvatar').src = avatar;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileRole').textContent = user.role_name;

    // Role buttons
    const roleButtons = document.getElementById('role-buttons');
    if (user.role_name === 'student') {
      roleButtons.innerHTML = `
        <a href="/pages/student-tests.html" class="btn btn-primary mt-2">Моите тестове</a>
      `;
    } else if (user.role_name === 'teacher' || user.role_name === 'admin') {
      roleButtons.innerHTML = `
        <a href="/pages/questions.html" class="btn btn-success mt-2 me-2">Създай въпрос</a>
        <a href="/pages/tests.html" class="btn btn-primary mt-2 me-2">Тестове</a>
        <a href="/pages/review-list.html" class="btn btn-warning mt-2">Прегледай тестове на ученици</a>
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

    // Filling the fields with the current data
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;

    // Submit logic for the edit form
    document.getElementById('profileEditForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('editUsername').value;
      const email = document.getElementById('editEmail').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const alertBox = document.getElementById('profileEditAlert');
      alertBox.innerHTML = '';
      alertBox.style.display = 'none';
      if (newPassword && newPassword !== confirmPassword) {
        alertBox.innerHTML = '<div class="alert alert-danger">Новата парола и потвърждението не съвпадат!</div>';
        alertBox.style.display = '';
        return;
      }
      try {
        const res = await fetch('/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          alertBox.innerHTML = '<div class="alert alert-success">Данните са обновени успешно!</div>';
          alertBox.style.display = '';
          // Refreshing the displayed data
          document.getElementById('profileUsername').textContent = username;
        } else {
          alertBox.innerHTML = `<div class="alert alert-danger">${data.message || 'Грешка при обновяване!'}</div>`;
          alertBox.style.display = '';
        }
      } catch (err) {
        alertBox.innerHTML = '<div class="alert alert-danger">Грешка при връзка със сървъра!</div>';
        alertBox.style.display = '';
      }
    });
  } catch (err) {
    console.error('Error loading profile:', err);
  }
});
