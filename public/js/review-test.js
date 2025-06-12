document.addEventListener('DOMContentLoaded', function() {
  const assignedId = new URLSearchParams(window.location.search).get('assigned_id');
  const reviewContainer = document.getElementById('reviewContainer');
  const saveBtn = document.getElementById('saveReviewBtn');
  const reviewResult = document.getElementById('reviewResult');

  if (!assignedId) {
    reviewContainer.innerHTML = '<div class="alert alert-danger">Липсва assigned_id!</div>';
    saveBtn.style.display = 'none';
    return;
  }

  fetch(`/assigned-tests/${assignedId}/review`)
    .then(res => res.json())
    .then(data => {
      if (!data.assigned || !data.questions) {
        reviewContainer.innerHTML = '<div class="alert alert-danger">Грешка при зареждане на теста.</div>';
        saveBtn.style.display = 'none';
        return;
      }
      let html = `<h4>Тест: ${data.assigned.test_title}</h4>`;
      html += `<h5>Студент: ${data.assigned.student_username}</h5>`;
      html += `<h6>Автоматични точки: <span id='autoScore'>${data.assigned.score}</span></h6>`;
      data.questions.forEach((q, idx) => {
        html += `<div class="card mb-3"><div class="card-body">`;
        html += `<b>${idx+1}. ${q.question_text}</b><br>`;
        html += `Отговор: <span>${q.answer_text_display || q.answer_text || '<i>няма</i>'}</span><br>`;
        if (q.question_type === 'open_text') {
          html += `Точки за този въпрос: <input type="number" min="0" value="0" data-qid="${q.id}" class="open-score form-control" style="max-width:100px;display:inline-block;">`;
        }
        html += `</div></div>`;
      });
      reviewContainer.innerHTML = html;
    });

  saveBtn.onclick = function() {
    const openScores = Array.from(document.querySelectorAll('.open-score')).map(input => ({
      question_id: input.getAttribute('data-qid'),
      points: input.value
    }));
    fetch(`/assigned-tests/${assignedId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openScores })
    })
    .then(res => res.json())
    .then(data => {
      reviewResult.innerHTML = `<div class="alert alert-success">${data.message || 'Оценката е записана!'}</div>`;
      saveBtn.disabled = true;
    })
    .catch(() => {
      reviewResult.innerHTML = `<div class="alert alert-danger">Грешка при записване на оценката!</div>`;
    });
  };
});

let currentSort = null;

function sortTests(tests) {
  const sorted = [...tests];
  switch (currentSort) {
    case 'dateDesc':
      return sorted.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    case 'dateAsc':
      return sorted.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    case 'scoreDesc':
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    case 'scoreAsc':
      return sorted.sort((a, b) => (a.score || 0) - (b.score || 0));
    default:
      return sorted;
  }
}