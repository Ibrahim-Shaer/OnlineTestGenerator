document.addEventListener('DOMContentLoaded', async function() {
  // Проверка за роля
  const res = await fetch('/auth/status');
  const data = await res.json();
  if (!data.loggedIn || (data.user.role !== 'teacher' && data.user.role !== 'admin')) {
    document.getElementById('role-error').style.display = '';
    document.getElementById('role-error').textContent = 'Нямате права за достъп до тази страница!';
    document.getElementById('testsTable').style.display = 'none';
    document.getElementById('createTestBtn').style.display = 'none';
    return;
  }

  // Показване/скриване на формата за създаване на тест
  document.getElementById('createTestBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const formDiv = document.getElementById('createTestFormDiv');
    formDiv.style.display = formDiv.style.display === 'none' ? '' : 'none';
    if (formDiv.style.display !== 'none') loadQuestions();
  });

  // Зареждане на въпросите за формата
  async function loadQuestions() {
    const res = await fetch('/questions/all');
    const questions = await res.json();
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    questions.forEach(q => {
      questionsList.innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${q.id}" id="q${q.id}" name="questions">
          <label class="form-check-label" for="q${q.id}">
            ${q.question_text} <span class="text-muted">(${q.question_type})</span>
          </label>
        </div>
      `;
    });
  }

  // Създаване на тест
  const createTestForm = document.getElementById('createTestForm');
  if (createTestForm) {
    createTestForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const title = document.getElementById('testTitle').value;
      const description = document.getElementById('testDescription').value;
      const selectedQuestions = Array.from(document.querySelectorAll('input[name="questions"]:checked')).map(cb => cb.value);

      if (!selectedQuestions.length) {
        alert('Избери поне един въпрос!');
        return;
      }

      const res = await fetch('/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions: selectedQuestions })
      });

      if (res.ok) {
        alert('Тестът е създаден успешно!');
        location.reload();
      } else {
        alert('Грешка при създаване на тест!');
      }
    });
  }

  // Зареждане на тестовете
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
            <a href="/assign-test.html?id=${test.id}" class="btn btn-info btn-sm">Възложи</a>
            <button class="btn btn-danger btn-sm" onclick="deleteTest(${test.id})">Изтрий</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    document.querySelector('#testsTable tbody').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Грешка при зареждане на тестовете.</td></tr>';
  }
});

// Примерна функция за изтриване (трябва да се реализира бекенд)
function deleteTest(id) {
  if (confirm('Сигурни ли сте, че искате да изтриете този тест?')) {
    fetch(`/tests/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) location.reload();
        else alert('Грешка при изтриване!');
      });
  }
}
