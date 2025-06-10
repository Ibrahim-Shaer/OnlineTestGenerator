document.addEventListener('DOMContentLoaded', function() {
  const usersTable = document.getElementById('usersTable');
  let editingUserId = null;

  // Bootstrap modals
  const userModal = new bootstrap.Modal(document.getElementById('userModal'));
  const userForm = document.getElementById('userForm');
  const userFormMsg = document.getElementById('userFormMsg');
  const userModalLabel = document.getElementById('userModalLabel');
  const userFormSubmitBtn = document.getElementById('userFormSubmitBtn');
  const userRoleSelect = document.getElementById('userRole');

  // Зареждане на роли за селекта
  function loadRoles() {
    fetch('/admin/roles')
      .then(res => res.json())
      .then(roles => {
        userRoleSelect.innerHTML = '';
        roles.forEach(role => {
          const opt = document.createElement('option');
          opt.value = role.name;
          opt.textContent = role.name.charAt(0).toUpperCase() + role.name.slice(1);
          userRoleSelect.appendChild(opt);
        });
      });
  }
  loadRoles();

  const openAddUserModalBtn = document.getElementById('openAddUserModalBtn');
  openAddUserModalBtn.onclick = function() {
    editingUserId = null;
    userModalLabel.textContent = 'Добави потребител';
    userForm.reset();
    userFormMsg.textContent = '';
    document.getElementById('userId').value = '';
    userFormSubmitBtn.textContent = 'Добави';
    loadRoles();
    userModal.show();
  };

  // Loading all users
  function loadUsers() {
    fetch('/admin/users')
      .then(res => res.json())
      .then(users => {
        usersTable.innerHTML = '';
        users.forEach(user => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role_name || ''}</td>
            <td>
              <button class="btn btn-sm btn-warning" data-id="${user.id}" data-action="edit">Редактирай</button>
              <button class="btn btn-sm btn-danger" data-id="${user.id}" data-action="delete">Изтрий</button>
            </td>
          `;
          usersTable.appendChild(tr);
        });
      });
  }
  loadUsers();

  // Actions for editing and deleting
  usersTable.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
      const id = e.target.getAttribute('data-id');
      const action = e.target.getAttribute('data-action');
      if (action === 'edit') {
        fetch('/admin/users')
          .then(res => res.json())
          .then(users => {
            const user = users.find(u => u.id == id);
            if (!user) return;
            editingUserId = id;
            userModalLabel.textContent = 'Редакция на потребител';
            userForm.reset();
            userFormMsg.textContent = '';
            document.getElementById('userId').value = user.id;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPassword').value = '';
            loadRoles();
            setTimeout(() => {
              userRoleSelect.value = user.role_name;
            }, 100);
            userFormSubmitBtn.textContent = 'Запази';
            userModal.show();
          });
      } else if (action === 'delete') {
        if (confirm('Сигурни ли сте, че искате да изтриете този потребител?')) {
          fetch(`/admin/users/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
              loadUsers();
              alert(data.message);
            });
        }
      }
    }
  });

  // Create/edit user through modal
  userForm.onsubmit = function(e) {
    e.preventDefault();
    userFormMsg.textContent = '';
    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = userRoleSelect.value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/users/${id}` : '/admin/users';
    const body = { username, email, role };
    if (password) body.password = password;
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          userFormMsg.textContent = '';
          userModal.hide();
          loadUsers();
          alert(data.message);
        } else if (data.error) {
          userFormMsg.textContent = data.error;
        }
      })
      .catch(() => {
        userFormMsg.textContent = 'Грешка при запис!';
      });
  };

  // --- Statistics ---
  function loadStats() {
    fetch('/admin/stats')
      .then(res => res.json())
      .then(stats => {
        const statsRow = document.getElementById('statsRow');
        statsRow.innerHTML = `
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Потребители</b><br>${stats.users}</div></div>
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Учители</b><br>${stats.teachers}</div></div>
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Админи</b><br>${stats.admins}</div></div>
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Категории</b><br>${stats.categories}</div></div>
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Въпроси</b><br>${stats.questions}</div></div>
          <div class="col-md-2 col-6 mb-2"><div class="card p-2 text-center"><b>Тестове</b><br>${stats.tests}</div></div>
        `;
      });
  }
  loadStats();

  // --- Categories ---
  const openAddCategoryModalBtn = document.getElementById('openAddCategoryModalBtn');
  const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
  const addCategoryForm = document.getElementById('addCategoryForm');
  const addCategoryMsg = document.getElementById('addCategoryMsg');
  const categoriesList = document.getElementById('categoriesList');

  // Modal for editing a category
  const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
  const editCategoryForm = document.getElementById('editCategoryForm');
  const editCategoryId = document.getElementById('editCategoryId');
  const editCategoryName = document.getElementById('editCategoryName');
  const editCategoryMsg = document.getElementById('editCategoryMsg');

  openAddCategoryModalBtn.onclick = function() {
    addCategoryForm.reset();
    addCategoryMsg.textContent = '';
    categoryModal.show();
  };

  // Loading all categories
  function loadCategories() {
    fetch('/questions/categories')
      .then(res => res.json())
      .then(categories => {
        categoriesList.innerHTML = '';
        categories.forEach(cat => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `
            <span>${cat.name}</span>
            <span>
              <button class="btn btn-sm btn-warning me-1 edit-category-btn" data-id="${cat.id}" data-name="${cat.name}">Редактирай</button>
              <button class="btn btn-sm btn-danger delete-category-btn" data-id="${cat.id}">Изтрий</button>
            </span>
          `;
          categoriesList.appendChild(li);
        });
      });
  }
  loadCategories();

  // Adding a category through modal
  addCategoryForm.onsubmit = function(e) {
    e.preventDefault();
    addCategoryMsg.textContent = '';
    const name = document.getElementById('addCategoryName').value;
    fetch('/questions/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          addCategoryMsg.textContent = '';
          categoryModal.hide();
          loadCategories();
          alert('Категорията е добавена успешно!');
        } else {
          addCategoryMsg.textContent = data.message || 'Грешка при добавяне!';
        }
      })
      .catch(() => {
        addCategoryMsg.textContent = 'Грешка при добавяне!';
      });
  };

  // Listeners for editing and deleting categories
  categoriesList.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-category-btn')) {
      // Opening the modal for editing
      editCategoryId.value = e.target.getAttribute('data-id');
      editCategoryName.value = e.target.getAttribute('data-name');
      editCategoryMsg.textContent = '';
      editCategoryModal.show();
    } else if (e.target.classList.contains('delete-category-btn')) {
      const id = e.target.getAttribute('data-id');
      if (confirm('Сигурни ли сте, че искате да изтриете тази категория?')) {
        fetch(`/questions/categories/${id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(data => {
            loadCategories();
            alert(data.message || 'Категорията е изтрита!');
          });
      }
    }
  });

  // Editing a category through modal
  editCategoryForm.onsubmit = function(e) {
    e.preventDefault();
    editCategoryMsg.textContent = '';
    const id = editCategoryId.value;
    const name = editCategoryName.value;
    fetch(`/questions/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          editCategoryMsg.textContent = '';
          editCategoryModal.hide();
          loadCategories();
          alert(data.message);
        } else {
          editCategoryMsg.textContent = data.message || 'Грешка при редакция!';
        }
      })
      .catch(() => {
        editCategoryMsg.textContent = 'Грешка при редакция!';
      });
  };
}); 