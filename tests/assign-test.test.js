
describe('Assign Test script', () => {
    let fetchMock;
    // flush microtasks
    const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

    beforeEach(() => {
      // Stub setTimeout to immediately execute callbacks
      jest.spyOn(global, 'setTimeout').mockImplementation((cb, t) => { cb(); return 0; });
      jest.spyOn(window, 'setTimeout').mockImplementation((cb, t) => { cb(); return 0; });

      // Mock fetch for endpoints
      fetchMock = jest.fn((url, opts) => {
        if (url.endsWith('/tests')) {
          return Promise.resolve({ json: () => Promise.resolve([
            { id: '12', title: 'Математика 7кл' },
            { id: '13', title: 'Биология 8кл' }
          ])});
        }
        if (url.endsWith('/auth/students')) {
          return Promise.resolve({ json: () => Promise.resolve([
            { id: '5', username: 'pesho' },
            { id: '6', username: 'gosho' }
          ])});
        }
        if (url.endsWith('/assigned-tests')) {
          return Promise.resolve({ json: () => Promise.resolve({ success: true }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
      });
      global.fetch = fetchMock;
      window.fetch = fetchMock;

      // Stub window.location.assign to avoid JSDOM navigation error
      delete window.location;
      window.location = {
        href: '',
        pathname: '',
        assign: jest.fn(url => {
          this.href = url;
          this.pathname = url;
        })
      };

      // Minimal DOM
      document.body.innerHTML = `
        <select id="testSelect"></select>
        <input id="studentSearch" />
        <div id="studentsList"></div>
        <button id="selectAllBtn"></button>
        <form id="assignTestForm"></form>
        <input id="startTime" value="2025-06-20T08:00" />
        <input id="endTime"   value="2025-06-20T10:00" />
        <div id="result"></div>
      `;

      // Load script
      require('../public/js/assign-test.js');
    });

    afterEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });

    it('loads tests and students list when DOMContentLoaded', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();

      const opts = Array.from(document.getElementById('testSelect').options)
        .map(o => ({ value: o.value, text: o.textContent }));
      expect(opts).toEqual([
        { value: '12', text: 'Математика 7кл' },
        { value: '13', text: 'Биология 8кл' }
      ]);

      const divs = document.querySelectorAll('.student-option');
      expect(divs.length).toBe(2);
      expect(divs[0].textContent).toBe('pesho');
      expect(divs[1].textContent).toBe('gosho');
    });

    it('when submitting sends POST to /assigned-tests with correct body', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flushPromises();

      // Select "gosho"
      document.querySelectorAll('.student-option')[1].click();
      document.getElementById('testSelect').value = '13';

      fetchMock.mockClear();
      document.getElementById('assignTestForm').dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(fetchMock).toHaveBeenCalledWith('/assigned-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: '13',
          student_ids: ['6'],
          start_time: '2025-06-20T08:00',
          end_time:   '2025-06-20T10:00'
        })
      });
    });

    
  });
