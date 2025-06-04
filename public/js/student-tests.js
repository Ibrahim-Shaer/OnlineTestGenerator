document.addEventListener('DOMContentLoaded', function() {
  fetch('/assigned-tests/mine')
    .then(res => res.json())
    .then(tests => {
      const tbody = document.querySelector('#assignedTestsTable tbody');
      if (!tests.length) {
        document.getElementById('noTests').style.display = '';
        return;
      }
      tests.forEach(test => {
        // Check if the test is in the allowed period
        const now = new Date();
        const start = new Date(test.start_time);
        const end = new Date(test.end_time);
        let action = '';
        if (now >= start && now <= end && test.status === 'assigned') {
          action = `<a href="/pages/solve-test.html?test_id=${test.test_id}" class="btn btn-success btn-sm">Започни</a>`;
        } else if (now < start) {
          action = '<span class="text-warning">Още не е започнал</span>';
        } else if (now > end) {
          action = '<span class="text-danger">Изтекъл</span>';
        } else if (test.status === 'completed') {
          action = '<span class="text-success">Завършен</span>';
        }
        tbody.innerHTML += `
          <tr>
            <td>${test.title}</td>
            <td>${test.description}</td>
            <td>${test.start_time.replace('T', ' ').slice(0, 16)}<br>до<br>${test.end_time.replace('T', ' ').slice(0, 16)}</td>
            <td>${action}</td>
          </tr>
        `;
      });
    });
});
