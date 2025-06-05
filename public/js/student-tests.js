let allTests = [];

function renderTests(tests) {
  const tbody = document.querySelector('#assignedTestsTable tbody');
  tbody.innerHTML = '';
  if (!tests.length) {
    document.getElementById('noTests').style.display = '';
    return;
  } else {
    document.getElementById('noTests').style.display = 'none';
  }
  tests.forEach(test => {
    const now = new Date();
    const start = new Date(test.start_time);
    const end = new Date(test.end_time);
    let action = '';
    let status = '';
    if (now >= start && now <= end && test.status === 'assigned') {
      action = `<a href="/pages/solve-test.html?assigned_id=${test.id}" class="btn btn-success btn-sm">Започни</a>`;
      status = 'assigned';
    } else if (now < start) {
      action = '<span class="text-warning">Още не е започнал</span>';
      status = 'assigned';
    } else if (now > end && test.status !== 'completed') {
      action = '<span class="text-danger">Изтекъл</span>';
      status = 'expired';
    } else if (test.status === 'completed') {
      action = '<span class="text-success">Завършен</span>';
      status = 'completed';
    }
    tbody.innerHTML += `
      <tr data-status="${status}">
        <td>${test.title}</td>
        <td>${test.description}</td>
        <td>${test.start_time.replace('T', ' ').slice(0, 16)}<br>до<br>${test.end_time.replace('T', ' ').slice(0, 16)}</td>
        <td>${action}</td>
        <td>${(test.score !== undefined && test.max_score !== undefined) ? `${test.score} / ${test.max_score}` : (test.score !== undefined ? test.score : '-')}</td>
      </tr>
    `;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  fetch('/assigned-tests/mine')
    .then(res => res.json())
    .then(tests => {
      allTests = tests;
      renderTests(allTests);
    });

  document.getElementById('searchTest').addEventListener('input', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
});

function applyFilters() {
  const search = document.getElementById('searchTest').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  let filtered = allTests.filter(test => {
    let now = new Date();
    let start = new Date(test.start_time);
    let end = new Date(test.end_time);
    let testStatus = '';
    if (now >= start && now <= end && test.status === 'assigned') {
      testStatus = 'assigned';
    } else if (now < start) {
      testStatus = 'assigned';
    } else if (now > end && test.status !== 'completed') {
      testStatus = 'expired';
    } else if (test.status === 'completed') {
      testStatus = 'completed';
    }
    const matchesSearch = test.title.toLowerCase().includes(search);
    const matchesStatus = !status || testStatus === status;
    return matchesSearch && matchesStatus;
  });
  renderTests(filtered);
}
