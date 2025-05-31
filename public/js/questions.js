document.addEventListener('DOMContentLoaded', async function() {
  // Проверка на роля (само teacher и admin)
  const roleError = document.getElementById('role-error');
  const form = document.getElementById('questionForm');
  let userRole = null;
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    if (!data.loggedIn || (data.user.role !== 'teacher' && data.user.role !== 'admin')) {
      roleError.style.display = '';
      roleError.textContent = 'Нямате права за достъп до тази страница!';
      form.style.display = 'none';
      return;
    }
    userRole = data.user.role;
    form.style.display = '';
  } catch (err) {
    roleError.style.display = '';
    roleError.textContent = 'Грешка при проверка на правата!';
    form.style.display = 'none';
    return;
  }

  // Зареждане на категориите
  const categorySelect = document.getElementById('category');
  try {
    const res = await fetch('/questions/categories');
    const categories = await res.json();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });
  } catch (err) {
    categorySelect.innerHTML = '<option>Грешка при зареждане на категориите</option>';
  }

  // Динамично показване на секцията за отговори
  const answersSection = document.getElementById('answersSection');
  const questionType = document.getElementById('questionType');

  function renderAnswers() {
    answersSection.innerHTML = '';
    if (questionType.value === 'multiple_choice') {
      // Множествен избор: динамично добавяне на отговори
      const answersDiv = document.createElement('div');
      answersDiv.id = 'answersDiv';
      answersDiv.innerHTML = '<label class="form-label">Възможни отговори:</label>';
      for (let i = 0; i < 2; i++) addAnswerInput(answersDiv);
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-secondary btn-sm mt-2';
      addBtn.textContent = 'Добави отговор';
      addBtn.onclick = () => addAnswerInput(answersDiv);
      answersDiv.appendChild(addBtn);
      answersSection.appendChild(answersDiv);
    } else if (questionType.value === 'true_false') {
      answersSection.innerHTML = `
        <label class="form-label">Избери верния отговор:</label>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="tfAnswer" id="tfTrue" value="true" checked>
          <label class="form-check-label" for="tfTrue">Вярно</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="tfAnswer" id="tfFalse" value="false">
          <label class="form-check-label" for="tfFalse">Грешно</label>
        </div>
      `;
    } else if (questionType.value === 'open_text') {
      answersSection.innerHTML = '<label class="form-label">Правилен отговор (текст):</label><input type="text" class="form-control" id="openAnswer" name="openAnswer">';
    }
  }

  function addAnswerInput(answersDiv) {
    const idx = answersDiv.querySelectorAll('.answer-row').length;
    const row = document.createElement('div');
    row.className = 'input-group mb-2 answer-row';
    row.innerHTML = `
      <div class="input-group-text">
        <input type="checkbox" name="correctAnswer" class="form-check-input mt-0" title="Верният отговор">
      </div>
      <input type="text" class="form-control" name="answerText" placeholder="Отговор ${idx + 1}" required>
      <button class="btn btn-danger" type="button">-</button>
    `;
    row.querySelector('button').onclick = () => row.remove();
    answersDiv.insertBefore(row, answersDiv.lastElementChild); // преди бутона за добавяне
  }

  questionType.addEventListener('change', renderAnswers);
  renderAnswers();

  // Изпращане на въпроса към бекенда
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const questionData = {
      category_id: categorySelect.value,
      question_type: questionType.value,
      question_text: document.getElementById('questionText').value,
      points: document.getElementById('points').value
    };
    if (questionType.value === 'multiple_choice') {
      const answers = [];
      const correct = [];
      document.querySelectorAll('.answer-row').forEach((row, i) => {
        const text = row.querySelector('input[name="answerText"]').value;
        const isCorrect = row.querySelector('input[name="correctAnswer"]').checked;
        answers.push(text);
        if (isCorrect) correct.push(i);
      });
      questionData.answers = answers;
      questionData.correct = correct;
    } else if (questionType.value === 'true_false') {
      questionData.correct = document.querySelector('input[name="tfAnswer"]:checked').value === 'true';
    } else if (questionType.value === 'open_text') {
      questionData.correct = document.getElementById('openAnswer').value;
    }
    try {
      const res = await fetch('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });
      const result = await res.json();
      if (res.ok) {
        alert('Въпросът е създаден успешно!');
        form.reset();
        renderAnswers();
      } else {
        alert(result.message || 'Грешка при създаване на въпрос!');
      }
    } catch (err) {
      alert('Грешка при връзка със сървъра!');
    }
  });
}); 