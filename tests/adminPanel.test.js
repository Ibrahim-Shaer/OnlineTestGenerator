/**
 * @jest-environment jsdom
 */

describe('Admin Panel script', () => {
    let fetchMock, modalInstance;
    const flushPromises = () => new Promise(r => setTimeout(r, 0));
  
    beforeAll(() => {
        // mock bootstrap.Modal
      modalInstance = { show: jest.fn() };
      global.bootstrap = { Modal: jest.fn(() => modalInstance) };
    });
  
    beforeEach(() => {
      // mock fetch everywhere
      fetchMock = jest.fn((url, opts) => {
        if (url.endsWith('/admin/roles')) {
          return Promise.resolve({ json: () => Promise.resolve([{ name: 'admin' }]) });
        }
        if (url.endsWith('/admin/users')) {
          return Promise.resolve({
            json: () => Promise.resolve([{ id: 1, username: 'ivan', email: 'ivan@a.bg', role_name: 'admin' }])
          });
        }
        if (url.endsWith('/admin/stats')) {
          return Promise.resolve({ json: () => Promise.resolve({
            users: 5, teachers: 2, admins: 1, categories: 3, questions: 10, tests: 4
          })});
        }
        if (url.endsWith('/questions/categories')) {
          return Promise.resolve({ json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
      });
      global.fetch = fetchMock;
      window.fetch = fetchMock;
  
      // full set of elements that the script expects
      document.body.innerHTML = `
        <button id="openAddUserModalBtn">Добави потребител</button>
        <div id="userModal"></div>
        <select id="userRole"></select>
        <table id="usersTable"></table>
        <div id="statsRow"></div>
  
        <form id="userForm"></form>
        <div id="userFormMsg"></div>
        <h5 id="userModalLabel"></h5>
        <button id="userFormSubmitBtn"></button>
        <input id="userId"/>
        <input id="userUsername"/>
        <input id="userEmail"/>
        <input id="userPassword"/>
  
        <button id="openAddCategoryModalBtn">Добави категория</button>
        <div id="categoryModal"></div>
        <form id="addCategoryForm"></form>
        <form id="addCategoryForm"></form>
        <div id="addCategoryMsg"></div> 
        <input id="addCategoryName"/>
        <ul id="categoriesList"></ul>
        <div id="editCategoryModal"></div>
        <form id="editCategoryForm">
          <input id="editCategoryId"/>
          <input id="editCategoryName"/>
        </form>
      `;
  
    // load the script
      require('../public/js/adminPanel.js');
    });
  
    afterEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });
  
    it('when clicking on "Add user" shows the modal', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();
      document.getElementById('openAddUserModalBtn').click();
  
      expect(bootstrap.Modal).toHaveBeenCalledWith(document.getElementById('userModal'));
      expect(modalInstance.show).toHaveBeenCalled();
    });
  
    it('loads users in #usersTable', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();
  
      const rows = document.querySelectorAll('#usersTable tr');
      expect(rows).toHaveLength(1);
      const cells = rows[0].querySelectorAll('td');
      expect(cells[0].textContent).toBe('ivan');
      expect(cells[1].textContent).toBe('ivan@a.bg');
      expect(cells[2].textContent).toBe('admin');
    });
  
    it('when submitting a new category sends POST to /questions/categories', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();
  
      document.getElementById('addCategoryName').value = 'нова категория';
      fetchMock.mockClear();
  
      document.getElementById('addCategoryForm').dispatchEvent(new Event('submit'));
      await flushPromises();
  
      expect(fetchMock).toHaveBeenCalledWith('/questions/categories', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'нова категория' })
      }));
    });
  
    it('when clicking on "Delete" button on category sends DELETE to the correct URL', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();
  
      // add one li with button
      const li = document.createElement('li');
      li.innerHTML = `<button class="delete-category-btn" data-id="42">Изтрий</button>`;
      document.getElementById('categoriesList').appendChild(li);
  
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      fetchMock.mockClear();
  
      li.querySelector('.delete-category-btn').click();
      await flushPromises();
  
      expect(fetchMock).toHaveBeenCalledWith('/questions/categories/42', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  
    it('when editing a user sends PUT to /admin/users/:id with new role', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();
  
      // add edit button to the table
      const tr = document.createElement('tr');
      tr.innerHTML = `<button data-id="7" data-action="edit">Редактирай</button>`;
      document.getElementById('usersTable').appendChild(tr);
  
      // mock /admin/users to return user 7
      fetchMock.mockImplementationOnce(() => Promise.resolve({
        json: () => Promise.resolve([{ id: 7, username: 'gosho', email: 'g@a.bg', role_name: 'teacher' }])
      }));
  
      tr.querySelector('button').click();
      await flushPromises();
  
      document.getElementById('userRole').value = 'admin';
      fetchMock.mockClear();
      document.getElementById('userForm').dispatchEvent(new Event('submit'));
      await flushPromises();
  
      expect(fetchMock).toHaveBeenCalledWith('/admin/users/7', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'gosho', email: 'g@a.bg', role: 'admin' })
      }));
    });
  });
  