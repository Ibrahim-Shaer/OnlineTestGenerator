document.addEventListener('DOMContentLoaded', function() {
  const listDiv = document.getElementById('assignedTestsList');
  let allTests = [];

  function renderTable(tests) {
    if (!tests.length) {
      listDiv.innerHTML = '<div class="alert alert-info">Няма възложени тестове.</div>';
      return;
    }
    let html = `<table class="table table-bordered"><thead>
      <tr>
        <th>Студент</th>
        <th>Тест</th>
        <th>Период</th>
        <th>Статус</th>
        <th>Точки</th>
        <th>Действие</th>
      </tr>
    </thead><tbody>`;
    tests.forEach(test => {
      html += `<tr>
        <td>${test.student_username}</td>
        <td>${test.title}</td>
        <td>${test.start_time.replace('T', ' ').slice(0, 16)}<br>до<br>${test.end_time.replace('T', ' ').slice(0, 16)}</td>
        <td>${test.status === 'completed' ? (test.manual_reviewed ? 'Оценен' : 'Изпратен') : 'Възложен'}</td>
        <td>${test.score || 0}</td>
        <td>
          <a href="/pages/review-test.html?assigned_id=${test.id}" class="btn btn-sm btn-warning">Прегледай</a>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    listDiv.innerHTML = html;
  }

  function filterAndRender() {
    const studentVal = document.getElementById('searchStudent').value.toLowerCase();
    const testVal = document.getElementById('searchTest').value.toLowerCase();
    const statusVal = document.getElementById('statusFilter').value;

    let filtered = allTests.filter(test => {
      const studentMatch = test.student_username.toLowerCase().includes(studentVal);
      const testMatch = test.title.toLowerCase().includes(testVal);
      let statusMatch = true;
      if (statusVal === 'not_reviewed') {
        statusMatch = test.status === 'completed' && !test.manual_reviewed;
      } else if (statusVal === 'reviewed') {
        statusMatch = test.status === 'completed' && !!test.manual_reviewed;
      }
      return studentMatch && testMatch && statusMatch;
    });
    renderTable(filtered);
  }

  fetch('/assigned-tests/assigned-by-me')
    .then(res => res.json())
    .then(tests => {
      allTests = tests;
      renderTable(allTests);

      document.getElementById('searchStudent').addEventListener('input', filterAndRender);
      document.getElementById('searchTest').addEventListener('input', filterAndRender);
      document.getElementById('statusFilter').addEventListener('change', filterAndRender);
    });
}); 