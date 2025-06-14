// public/js/solve-test.js
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const assignedId = urlParams.get('assigned_id');
  const form = document.getElementById('solveTestForm');
  const questionsContainer = document.getElementById('questionsContainer');
  const resultDiv = document.getElementById('result');
  const timerDisplay = document.getElementById('timerDisplay');

  if (!assignedId) {
    resultDiv.textContent = 'Липсва assigned_id!';
    return;
  }

  // Зареждаме въпросите и данните за теста
  fetch(`/assigned-tests/${assignedId}/questions`)
    .then(res => res.json())
    .then(data => {
      if (!data.questions || !data.questions.length) {
        form.innerHTML = '<div class="alert alert-warning">Няма въпроси за този тест.</div>';
        return;
      }

      // --- Стартиране на таймера ---
      if (data.assigned && data.assigned.duration) {
        let timeLeft = data.assigned.duration * 60; // в секунди

        const countdownInterval = setInterval(() => {
          const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
          const secs = String(timeLeft % 60).padStart(2, '0');
          timerDisplay.textContent = `Оставащо време: ${mins}:${secs}`;

          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            resultDiv.innerHTML = '<div class="alert alert-warning">Времето изтече! Тестът се предава автоматично.</div>';
            submitAnswers(); // автоматично подаване
          }
          timeLeft--;
        }, 1000);
      }

      // --- Рендер на въпросите ---
      data.questions.forEach((q, idx) => {
        let html = `<div class="mb-3">
                      <label class="form-label">${idx+1}. ${q.question_text}</label>`;
        if (q.question_type === 'multiple_choice') {
          q.answers.forEach(ans => {
            html += `
              <div class="form-check">
                <input class="form-check-input" type="radio"
                       name="q${q.id}" value="${ans.id}" id="a${ans.id}" required>
                <label class="form-check-label" for="a${ans.id}">${ans.answer_text}</label>
              </div>`;
          });
        } else if (q.question_type === 'true_false') {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="radio"
                     name="q${q.id}" value="Да" id="q${q.id}_true" required>
              <label class="form-check-label" for="q${q.id}_true">Вярно</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio"
                     name="q${q.id}" value="Не" id="q${q.id}_false" required>
              <label class="form-check-label" for="q${q.id}_false">Грешно</label>
            </div>`;
        } else if (q.question_type === 'open_text') {
          html += `<textarea class="form-control"
                             name="q${q.id}" rows="2" required></textarea>`;
        }
        html += `</div>`;
        questionsContainer.insertAdjacentHTML('beforeend', html);
      });
    })
    .catch(err => {
      console.error(err);
      resultDiv.innerHTML = '<div class="alert alert-danger">Грешка при зареждане на теста.</div>';
    });

  // Хендлър за ръчно подаване
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitAnswers();
  });

  // Функция за подаване на отговорите
  function submitAnswers() {
    const formData = new FormData(form);
    const answers = [];
    for (let [key, value] of formData.entries()) {
      answers.push({ question_id: key.replace('q',''), answer: value });
    }
    fetch(`/assigned-tests/${assignedId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    })
    .then(res => res.json())
    .then(data => {
      resultDiv.textContent = data.message || 'Изпратено!';
      setTimeout(() => {
        window.location.href = '/pages/student-tests.html';
      }, 1200);
    });
  }
});
