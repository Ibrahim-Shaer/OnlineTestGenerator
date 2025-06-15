
const fs = require('fs');
const path = require('path');

describe('Solve Test Page — manual submit only', () => {
  let originalFetch;
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.resolve(__dirname, '../public/pages/solve-test.html'),
      'utf8'
    );
  });

  beforeEach(async () => {
    // 1) Load HTML
    document.documentElement.innerHTML = html;
    if (!document.getElementById('solveTestForm')) {
      const f = document.createElement('form');
      f.id = 'solveTestForm';
      document.body.appendChild(f);
    }
    if (!document.getElementById('questionsContainer')) {
      const qc = document.createElement('div');
      qc.id = 'questionsContainer';
      document.body.appendChild(qc);
    }
    if (!document.getElementById('result')) {
      const rd = document.createElement('div');
      rd.id = 'result';
      document.body.appendChild(rd);
    }
    if (!document.getElementById('timerDisplay')) {
      const td = document.createElement('span');
      td.id = 'timerDisplay';
      document.body.appendChild(td);
    }

    // 2) Fake URL & assign 
    window.history.pushState({}, '', '/solve-test.html?assigned_id=123');
    window.location.assign = jest.fn();

    // 3) Mock fetch: first for questions, then for submit
    originalFetch = global.fetch;
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assigned: { duration: 5 },   
          questions: [
            { id: 1, question_text: '2+2?', question_type: 'open_text', answers: [] }
          ]
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Ръчно изпратено!' })
      });

    // 4) Load and start the script
    const script = fs.readFileSync(
      path.resolve(__dirname, '../public/js/solve-test.js'),
      'utf8'
    );
    eval(script);
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // 5) Waiting both .then(): fetch → res.json() → render
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('manual submit works', async () => {
    // textarea is rendered already
    const textarea = document.querySelector('textarea[name="q1"]');
    expect(textarea).not.toBeNull();

    // fill и submit
    textarea.value = '4';
    document
      .getElementById('solveTestForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // wait for submit .then()
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/assigned-tests/123/submit',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );
  });
});
