document.addEventListener('DOMContentLoaded', async function() {
  // Checking role
  const res = await fetch('/auth/status');
  const data = await res.json();
  if (!data.loggedIn || (data.user.role !== 'teacher' && data.user.role !== 'admin')) {
    document.getElementById('role-error').style.display = '';
    document.getElementById('role-error').textContent = 'Нямате права за достъп до тази страница!';
    document.getElementById('testsTable').style.display = 'none';
    document.getElementById('createTestBtn').style.display = 'none';
    return;
  }

  // Showing/hiding the form for creating a test
  document.getElementById('createTestBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const formDiv = document.getElementById('createTestFormDiv');
    formDiv.style.display = formDiv.style.display === 'none' ? '' : 'none';
    if (formDiv.style.display !== 'none') loadQuestions();
  });

  // Loading questions for the form
  async function loadQuestions() {
    const res = await fetch('/questions/all');
    const questions = await res.json();
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    questions.forEach(q => {
      questionsList.innerHTML += `
        <div class="form-check" data-category-id="${q.category_id}">
          <input class="form-check-input" type="checkbox" value="${q.id}" id="q${q.id}" name="questions">
          <label class="form-check-label" for="q${q.id}">
            ${q.question_text} <span class="text-muted">(${q.question_type})</span>
          </label>
        </div>
      `;
    });
  }

  // Creating a test
  const createTestForm = document.getElementById('createTestForm');
  if (createTestForm) {
    createTestForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const title = document.getElementById('testTitle').value;
      const description = document.getElementById('testDescription').value;
      const duration = document.getElementById('testDuration').value;
      const selectedQuestions = Array.from(document.querySelectorAll('input[name="questions"]:checked')).map(cb => cb.value);

      if (!selectedQuestions.length) {
        alert('Избери поне един въпрос!');
        return;
      }

      const res = await fetch('/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, duration, questions: selectedQuestions })
      });

      if (res.ok) {
        alert('Тестът е създаден успешно!');
        location.reload();
      } else {
        alert('Грешка при създаване на тест!');
      }
    });
  }

  // Loading tests
  try {
    const response = await fetch('/tests');
    const tests = await response.json();
    const tbody = document.querySelector('#testsTable tbody');
    tbody.innerHTML = '';

    if (!tests.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Няма създадени тестове.</td></tr>';
      return;
    }

    tests.forEach(test => {
      tbody.innerHTML += `
        <tr>
          <td>${test.title}</td>
          <td>${test.questionCount}</td>
          <td>${test.assignedTo || '-'}</td>
          <td>
            <a href="/edit-test.html?id=${test.id}" class="btn btn-warning btn-sm">Редактирай</a>
            <button class="btn btn-info btn-sm" onclick="deleteTest(${test.id})">Изтрий</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    document.querySelector('#testsTable tbody').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Грешка при зареждане на тестовете.</td></tr>';
  }

  let isTeacherOrAdmin = false;

 
  fetch('/auth/status')
    .then(res => res.json())
    .then(status => {
      isTeacherOrAdmin = status.loggedIn && (status.user.role === 'teacher' || status.user.role === 'admin');
      loadTests();
    });

  function loadTests() {
    fetch('/tests')
      .then(res => res.json())
      .then(tests => {
        const tbody = document.querySelector('#testsTable tbody');
        tbody.innerHTML = '';
        tests.forEach(test => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${test.title}</td>
            <td>${test.questionCount}</td>
            <td>${test.assignedTo || '-'}</td>
            <td>
              ${isTeacherOrAdmin ? `<button class="btn btn-sm btn-warning assign-btn" data-id="${test.id}">Възложи</button>` : ''}
            </td>
          `;
          tbody.appendChild(tr);
        });

        
        if (isTeacherOrAdmin) {
          document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const testId = this.getAttribute('data-id');
              window.location.href = `assign-test.html?test_id=${testId}`;
            });
          });
        }

        if (!isTeacherOrAdmin) {
          document.getElementById('assignHeader').style.display = 'none';
        }
      });
  }

  // --- Random Questions by Category ---
  async function loadCategories() {
    const res = await fetch('/questions/categories');
    const categories = await res.json();
    const catSelect = document.getElementById('randomCategory');
    if (!catSelect) return;
    catSelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  // Loading categories when the form is shown
  document.getElementById('createTestBtn').addEventListener('click', function() {
    setTimeout(loadCategories, 100); // small delay for DOM
  });

  // Adding random questions
  document.getElementById('addRandomQuestionsBtn')?.addEventListener('click', async function() {
    const catId = document.getElementById('randomCategory').value;
    const count = document.getElementById('randomCount').value;
    const errorDiv = document.getElementById('randomQuestionsError');
    if (!catId || !count) return;
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    const res = await fetch(`/questions/random?category_id=${catId}&count=${count}`);
    const questions = await res.json();
    if (!Array.isArray(questions)) {
      errorDiv.textContent = questions.message || 'Грешка при зареждане на въпросите!';
      errorDiv.style.display = '';
      return;
    }
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    const questionsList = document.getElementById('questionsList');
    const catSelect = document.getElementById('randomCategory');
    const selectedCatName = catSelect.options[catSelect.selectedIndex].textContent;
    // Uncheck всички въпроси от тази категория
    document.querySelectorAll('.form-check[data-category-id]').forEach(div => {
      if (div.getAttribute('data-category-id') === catId) {
        div.querySelector('input[type="checkbox"]').checked = false;
      }
    });
    // Чеквам само новите random въпроси
    questions.forEach(q => {
      if (!document.getElementById('q'+q.id)) {
        questionsList.innerHTML += `
          <div class="form-check" data-category-id="${q.category_id}">
            <input class="form-check-input" type="checkbox" value="${q.id}" id="q${q.id}" name="questions" checked>
            <label class="form-check-label" for="q${q.id}">
              ${q.question_text} <span class="text-muted">(${q.question_type})</span>
            </label>
          </div>
        `;
      } else {
        document.getElementById('q'+q.id).checked = true;
      }
    });
  });
});

//function for deletion (must be implemented in backend)
function deleteTest(id) {
  if (confirm('Are you sure you want to delete this test?')) {
    fetch(`/tests/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) location.reload();
        else alert('Грешка при изтриване!');
      });
  }
}
