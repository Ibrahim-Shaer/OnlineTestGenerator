document.addEventListener('DOMContentLoaded', async function() {
  // Check for role
  const res = await fetch('/auth/status');
  const data = await res.json();
  if (!data.loggedIn || data.user.role !== 'student') {
    window.location.href = '/pages/login.html';
    return;
  }

  // Loading tests
  try {
    const response = await fetch('/tests');
    const tests = await response.json();
    const tbody = document.querySelector('#testsTable tbody');
    tbody.innerHTML = '';

    if (!tests.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Нямате възложени тестове.</td></tr>';
      return;
    }

    tests.forEach(test => {
      tbody.innerHTML += `
        <tr>
          <td>${test.title}</td>
          <td>${test.status === 'done' ? 'Направен' : 'Ненаправен'}</td>
          <td>${test.points !== null ? test.points : '-'}</td>
          <td>${test.grade !== null ? test.grade : '-'}</td>
          <td>
            ${test.status === 'done' ? 
              '<span class="text-success">Завършен</span>' : 
              `<a href="/do-test.html?id=${test.id}" class="btn btn-primary btn-sm">Започни</a>`
            }
          </td>
        </tr>
      `;
    });
  } catch (err) {
    document.querySelector('#testsTable tbody').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Грешка при зареждане на тестовете.</td></tr>';
  }
});
