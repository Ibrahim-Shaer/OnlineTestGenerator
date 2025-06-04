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
  let allStudents = [];
  let selectedStudents = [];
  fetch('/auth/students') 
    .then(res => res.json())
    .then(students => {
      allStudents = students;
      renderStudentOptions('');
    });

  function renderStudentOptions(filter) {
    const list = document.getElementById('studentsList');
    list.innerHTML = '';
    allStudents
      .filter(st => st.username.toLowerCase().startsWith(filter.toLowerCase()))
      .forEach(st => {
        const div = document.createElement('div');
        div.className = 'student-option list-group-item list-group-item-action mb-1';
        div.textContent = st.username;
        if (selectedStudents.includes(st.id.toString())) {
          div.classList.add('selected', 'active');
        }
        div.onclick = function() {
          const idx = selectedStudents.indexOf(st.id.toString());
          if (idx === -1) {
            selectedStudents.push(st.id.toString());
            div.classList.add('selected', 'active');
          } else {
            selectedStudents.splice(idx, 1);
            div.classList.remove('selected', 'active');
          }
        };
        list.appendChild(div);
      });
  }

  document.getElementById('studentSearch').addEventListener('input', function() {
    renderStudentOptions(this.value);
  });

  document.getElementById('selectAllBtn').addEventListener('click', function() {
    const filtered = allStudents.filter(st => st.username.toLowerCase().includes(document.getElementById('studentSearch').value.toLowerCase()));
    const allSelected = filtered.every(st => selectedStudents.includes(st.id.toString()));
    if (allSelected) {
      // Deselect all
      selectedStudents = selectedStudents.filter(id => !filtered.map(st => st.id.toString()).includes(id));
      this.textContent = 'Избери всички';
    } else {
      // Select all
      filtered.forEach(st => {
        if (!selectedStudents.includes(st.id.toString())) selectedStudents.push(st.id.toString());
      });
      this.textContent = 'Премахни всички';
    }
    renderStudentOptions(document.getElementById('studentSearch').value);
  });

  document.getElementById('assignTestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const test_id = document.getElementById('testSelect').value;
    const student_ids = selectedStudents;
    const start_time = document.getElementById('startTime').value;
    const end_time = document.getElementById('endTime').value;
    fetch('/assigned-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id, student_ids, start_time, end_time })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('result').innerHTML = '<div class="alert alert-success">Тестът е възложен успешно!</div>';
      setTimeout(() => {
        window.location.href = '/pages/tests.html';
      }, 1500);
    });
  });
}); 