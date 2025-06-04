document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('test_id');
  if (!testId) {
    document.getElementById('result').textContent = 'Липсва test_id!';
    return;
  }
  fetch(`/assigned-tests/${testId}/questions`)
    .then(res => res.json())
    .then(data => {
      const form = document.getElementById('solveTestForm');
      if (!data.questions || !data.questions.length) {
        form.innerHTML = '<div class="alert alert-warning">Няма въпроси за този тест.</div>';
        return;
      }
      data.questions.forEach((q, idx) => {
        let html = `<div class="mb-3"><label class="form-label">${idx+1}. ${q.question_text}</label>`;
        if (q.question_type === 'multiple_choice') {
          q.answers.forEach(ans => {
            html += `<div class="form-check">
              <input class="form-check-input" type="radio" name="q${q.id}" value="${ans.id}" id="a${ans.id}" required>
              <label class="form-check-label" for="a${ans.id}">${ans.answer_text}</label>
            </div>`;
          });
        } else if (q.question_type === 'true_false') {
          html += `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="q${q.id}" value="true" id="q${q.id}_true" required>
              <label class="form-check-label" for="q${q.id}_true">Вярно</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="q${q.id}" value="false" id="q${q.id}_false" required>
              <label class="form-check-label" for="q${q.id}_false">Грешно</label>
            </div>
          `;
        } else if (q.question_type === 'open_text') {
          html += `<textarea class="form-control" name="q${q.id}" rows="2" required></textarea>`;
        }
        html += '</div>';
        document.getElementById('questionsContainer').innerHTML += html;
      });
      
    });

  document.getElementById('solveTestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const answers = [];
    for (let [key, value] of formData.entries()) {
      const question_id = key.replace('q', '');
      answers.push({ question_id, answer: value });
    }
    fetch(`/assigned-tests/${testId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('result').textContent = data.message || 'Изпратено!';
      setTimeout(() => {
        window.location.href = '/pages/student-tests.html';
      }, 1200);
    });
  });
}); 