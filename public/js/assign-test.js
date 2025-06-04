document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const testIdFromQuery = urlParams.get('test_id');
  fetch('/tests')
    .then(res => res.json())
    .then(tests => {
      const select = document.getElementById('testSelect');
      tests.forEach(test => {
        const opt = document.createElement('option');
        opt.value = test.id;
        opt.textContent = test.title;
        select.appendChild(opt);
      });
      if (testIdFromQuery) {
        select.value = testIdFromQuery;
      }
    });
  fetch('/auth/students') 
    .then(res => res.json())
    .then(students => {
      const select = document.getElementById('studentsSelect');
      students.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = st.username;
        select.appendChild(opt);
      });
    });
  document.getElementById('assignTestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const test_id = document.getElementById('testSelect').value;
    const student_ids = Array.from(document.getElementById('studentsSelect').selectedOptions).map(opt => opt.value);
    const start_time = document.getElementById('startTime').value;
    const end_time = document.getElementById('endTime').value;
    fetch('/assigned-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id, student_ids, start_time, end_time })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('result').textContent = data.message || 'Грешка!';
    });
  });
}); 