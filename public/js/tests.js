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
    // Uncheck all questions from this category
    document.querySelectorAll('.form-check[data-category-id]').forEach(div => {
      if (div.getAttribute('data-category-id') === catId) {
        div.querySelector('input[type="checkbox"]').checked = false;
      }
    });
    // Check only the new random questions from this category
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

  let allQuestions = [];
  let selectedQuestions = [];
  let allCategories = [];

  // Loading categories for the modal filter
  async function loadModalCategories() {
    const res = await fetch('/questions/categories');
    allCategories = await res.json();
    const catSelect = document.getElementById('modalCategoryFilter');
    if (!catSelect) return;
    catSelect.innerHTML = '<option value="">Всички категории</option>';
    allCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  // Loading all questions for the modal
  async function loadModalQuestions() {
    const res = await fetch('/questions/all');
    allQuestions = await res.json();
    renderModalQuestions();
  }

  function renderModalQuestions() {
    const listDiv = document.getElementById('modalQuestionsList');
    const search = document.getElementById('modalSearchQuestion').value.toLowerCase();
    const catId = document.getElementById('modalCategoryFilter').value;
    let filtered = allQuestions.filter(q => {
      const matchesText = q.question_text.toLowerCase().includes(search);
      const matchesCat = !catId || q.category_id == catId;
      return matchesText && matchesCat;
    });
    listDiv.innerHTML = '';
    if (!filtered.length) {
      listDiv.innerHTML = '<div class="text-muted">Няма въпроси.</div>';
      return;
    }
    filtered.forEach(q => {
      const checked = selectedQuestions.includes(q.id.toString()) ? 'checked' : '';
      listDiv.innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${q.id}" id="modalQ${q.id}" ${checked}>
          <label class="form-check-label" for="modalQ${q.id}">
            ${q.question_text} <span class="text-muted">(${q.question_type})</span>
          </label>
        </div>
      `;
    });
  }

  // --- MODAL FILTER: Two modes (manual/dynamic) ---
  const manualModeBtn = document.getElementById('manualModeBtn');
  const dynamicModeBtn = document.getElementById('dynamicModeBtn');
  const manualQuestionsSection = document.getElementById('manualQuestionsSection');
  const dynamicQuestionsSection = document.getElementById('dynamicQuestionsSection');
  const selectedQuestionsEditSection = document.getElementById('selectedQuestionsEditSection');
  const selectedQuestionsEditList = document.getElementById('selectedQuestionsEditList');
  const noSelectedQuestionsEdit = document.getElementById('noSelectedQuestionsEdit');

  let modalMode = 'manual'; // 'manual' or 'dynamic'

  function showManualMode() {
    modalMode = 'manual';
    manualQuestionsSection.style.display = '';
    dynamicQuestionsSection.style.display = 'none';
    manualModeBtn.classList.add('active');
    dynamicModeBtn.classList.remove('active');
  }
  function showDynamicMode() {
    modalMode = 'dynamic';
    manualQuestionsSection.style.display = 'none';
    dynamicQuestionsSection.style.display = '';
    manualModeBtn.classList.remove('active');
    dynamicModeBtn.classList.add('active');
  }
  manualModeBtn.addEventListener('click', showManualMode);
  dynamicModeBtn.addEventListener('click', showDynamicMode);

  // Loading categories for the dynamic mode
  async function loadDynamicCategories() {
    const res = await fetch('/questions/categories');
    const categories = await res.json();
    const catSelect = document.getElementById('dynamicCategory');
    if (!catSelect) return;
    catSelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  // Generating random questions
  const generateDynamicQuestionsBtn = document.getElementById('generateDynamicQuestionsBtn');
  generateDynamicQuestionsBtn.addEventListener('click', async function() {
    const catId = document.getElementById('dynamicCategory').value;
    const count = document.getElementById('dynamicCount').value;
    const errorDiv = document.getElementById('dynamicQuestionsError');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    if (!catId || !count) return;
    const res = await fetch(`/questions/random?category_id=${catId}&count=${count}`);
    const questions = await res.json();
    if (!Array.isArray(questions)) {
      errorDiv.textContent = questions.message || 'Грешка при зареждане на въпросите!';
      errorDiv.style.display = '';
      return;
    }
    // Replace the selected questions with the new random
    selectedQuestions = questions.map(q => q.id.toString());
    renderSelectedQuestionsEdit();
    selectedQuestionsEditSection.style.display = '';
  });

  // Showing the selected questions with the possibility to remove
  function renderSelectedQuestionsEdit() {
    selectedQuestionsEditList.innerHTML = '';
    if (!selectedQuestions.length) {
      noSelectedQuestionsEdit.style.display = '';
      return;
    }
    noSelectedQuestionsEdit.style.display = 'none';
    selectedQuestions.forEach(qid => {
      const q = allQuestions.find(q => q.id == qid);
      if (q) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center py-3 fs-5';
        li.innerHTML = `<span>${q.question_text} <span class=\"text-muted\">(${q.question_type})</span></span>`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger ms-2';
        removeBtn.innerHTML = '<i class="fa fa-trash"></i>';
        removeBtn.title = 'Премахни въпроса';
        removeBtn.onclick = () => {
          selectedQuestions = selectedQuestions.filter(id => id !== qid);
          renderSelectedQuestionsEdit();
        };
        li.appendChild(removeBtn);
        li.onmouseover = () => li.style.background = '#f8f9fa';
        li.onmouseout = () => li.style.background = '';
        selectedQuestionsEditList.appendChild(li);
      }
    });
  }

    // When manually selecting – when checking/unchecking, we update the list
  function handleManualCheckChange() {
    selectedQuestions = Array.from(document.querySelectorAll('#modalQuestionsList input[type="checkbox"]:checked')).map(cb => cb.value);
    renderSelectedQuestionsEdit();
    selectedQuestionsEditSection.style.display = '';
  }
  // Add the handler after each render of the manual list
  const origRenderModalQuestions = renderModalQuestions;
  renderModalQuestions = function() {
    origRenderModalQuestions();
    document.querySelectorAll('#modalQuestionsList input[type="checkbox"]').forEach(cb => {
      cb.onchange = handleManualCheckChange;
    });
    renderSelectedQuestionsEdit();
    selectedQuestionsEditSection.style.display = '';
  };

  // When opening the modal – load both sections
  const openQuestionsModalBtn = document.getElementById('openQuestionsModalBtn');
  if (openQuestionsModalBtn) {
    openQuestionsModalBtn.addEventListener('click', async function() {
      await loadModalCategories();
      await loadModalQuestions();
      await loadDynamicCategories();
      document.getElementById('modalSearchQuestion').value = '';
      document.getElementById('modalCategoryFilter').value = '';
      renderModalQuestions();
      showManualMode();
      renderSelectedQuestionsEdit();
      selectedQuestionsEditSection.style.display = selectedQuestions.length ? '' : 'none';
      const modal = new bootstrap.Modal(document.getElementById('questionsModal'));
      modal.show();
    });
  }

  document.getElementById('modalSearchQuestion').addEventListener('input', renderModalQuestions);
  document.getElementById('modalCategoryFilter').addEventListener('change', renderModalQuestions);

  document.getElementById('saveQuestionsSelectionBtn').addEventListener('click', function() {
    renderSelectedQuestionsPreview();
    const modal = bootstrap.Modal.getInstance(document.getElementById('questionsModal'));
    modal.hide();
  });

  function renderSelectedQuestionsPreview() {
    const previewDiv = document.getElementById('selectedQuestionsPreview');
    if (!selectedQuestions.length) {
      previewDiv.innerHTML = '<span class="text-muted">Няма избрани въпроси.</span>';
      return;
    }
    previewDiv.innerHTML = '<b>Избрани въпроси:</b><ul>';
    selectedQuestions.forEach(qid => {
      const q = allQuestions.find(q => q.id == qid);
      if (q) previewDiv.innerHTML += `<li>${q.question_text} <span class="text-muted">(${q.question_type})</span></li>`;
    });
    previewDiv.innerHTML += '</ul>';
  }
});

//function for deletion (must be implemented in the backend)
function deleteTest(id) {
  if (confirm('Are you sure you want to delete this test?')) {
    fetch(`/tests/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) location.reload();
        else alert('Грешка при изтриване!');
      });
  }
}
