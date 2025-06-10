document.addEventListener('DOMContentLoaded', async function() {
  // Checking role (only teacher and admin)
  const roleError = document.getElementById('role-error');
  const form = document.getElementById('questionForm');
  let userRole = null;
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    if (!data.loggedIn || (data.user.role_name !== 'teacher' && data.user.role_name !== 'admin')) {
      roleError.style.display = '';
      roleError.textContent = 'Нямате права за достъп до тази страница!';
      form.style.display = 'none';
      return;
    }
    userRole = data.user.role_name;
    form.style.display = '';
  } catch (err) {
    roleError.style.display = '';
    roleError.textContent = 'Грешка при проверка на правата!';
    form.style.display = 'none';
    return;
  }

  // Loading categories
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

  // Dynamically showing the answers section
  const answersSection = document.getElementById('answersSection');
  const questionType = document.getElementById('questionType');

  function renderAnswers() {
    answersSection.innerHTML = '';
    if (questionType.value === 'multiple_choice') {
      // Multiple choice: dynamically adding answers
      const answersDiv = document.createElement('div');
      answersDiv.id = 'answersDiv';
      answersDiv.innerHTML = '<label class="form-label">Възможни отговори:</label>';
      for (let i = 0; i < 2; i++) addAnswerInput(answersDiv);
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-success btn-sm mt-2';
      addBtn.innerHTML = '<i class="fa fa-plus"></i> Добави отговор';
      addBtn.setAttribute('aria-label', 'Добави отговор');
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
        <input type="checkbox" name="correctAnswer" class="form-check-input mt-0" title="Верният отговор" aria-label="Маркирай като верен отговор">
      </div>
      <input type="text" class="form-control" name="answerText" placeholder="Отговор ${idx + 1}" required aria-label="Отговор ${idx + 1}">
      <button class="btn btn-outline-danger" type="button" aria-label="Премахни отговор"><i class="fa fa-trash"></i></button>
    `;
    row.querySelector('button').onclick = () => row.remove();
    answersDiv.insertBefore(row, answersDiv.lastElementChild); 
  }

  questionType.addEventListener('change', renderAnswers);
  renderAnswers();

  // Sending the question to the backend
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
      document.querySelectorAll('.answer-row').forEach(row => {
        const text = row.querySelector('input[name="answerText"]').value;
        const isCorrect = row.querySelector('input[name="correctAnswer"]').checked;
        answers.push({ answer_text: text, is_correct: isCorrect });
      });
      questionData.answers = answers;
    } else if (questionType.value === 'true_false') {
      questionData.correct = document.querySelector('input[name="tfAnswer"]:checked').value === 'true' ? "Да" : "Не";
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

  //Category Modal Logic 
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const addCategoryModal = document.getElementById('addCategoryModal');
  const saveCategoryBtn = document.getElementById('saveCategoryBtn');
  const newCategoryName = document.getElementById('newCategoryName');
  const addCategoryError = document.getElementById('addCategoryError');
  let bsAddCategoryModal = null;
  if (addCategoryModal) {
    bsAddCategoryModal = new bootstrap.Modal(addCategoryModal);
    addCategoryBtn.addEventListener('click', () => {
      newCategoryName.value = '';
      addCategoryError.style.display = 'none';
      bsAddCategoryModal.show();
    });
    saveCategoryBtn.addEventListener('click', async () => {
      const name = newCategoryName.value.trim();
      if (!name) {
        addCategoryError.textContent = 'Моля, въведете име на категория!';
        addCategoryError.style.display = '';
        return;
      }
      try {
        const res = await fetch('/questions/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const result = await res.json();
        if (res.ok) {
          // Add the new category to the select
          const opt = document.createElement('option');
          opt.value = result.id;
          opt.textContent = result.name;
          categorySelect.appendChild(opt);
          categorySelect.value = result.id;
          bsAddCategoryModal.hide();
        } else {
          addCategoryError.textContent = result.message || 'Грешка при добавяне на категория!';
          addCategoryError.style.display = '';
        }
      } catch (err) {
        addCategoryError.textContent = 'Грешка при връзка със сървъра!';
        addCategoryError.style.display = '';
      }
    });
  }
}); 