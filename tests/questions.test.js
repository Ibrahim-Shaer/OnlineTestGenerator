/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Question Creation Page', () => {
  let originalFetch;
  let html;

  beforeAll(() => {
    // Load HTML fixture for question creation page
    html = fs.readFileSync(
      path.resolve(__dirname, '../public/pages/questions.html'),
      'utf8'
    );
  });

  beforeEach(async () => {
    // Set up DOM
    document.documentElement.innerHTML = html;

    // Stub bootstrap modal on window
    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({ show: jest.fn(), hide: jest.fn() }))
    };

    // Mock fetch and alert
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    global.alert = jest.fn();

    // Polyfill for mockResolvedValueOnce and mockResolvedValue
    global.fetch.mockResolvedValueOnce = function (value) {
      this.mockImplementationOnce(() => Promise.resolve(value));
      return this;
    };
    global.fetch.mockResolvedValue = function (value) {
      this.mockImplementation(() => Promise.resolve(value));
      return this;
    };

    // Mock /auth/status and /questions/categories
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ loggedIn: true, user: { role_name: 'teacher' } })
    });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 'cat1', name: 'Category 1' },
        { id: 'cat2', name: 'Category 2' }
      ])
    });

    // Load script and trigger initialization
    require(path.resolve(__dirname, '../public/js/questions.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async initialization to complete
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    delete window.bootstrap;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('creates a multiple choice question', async () => {
    const categorySelect = document.getElementById('category');
    const questionType = document.getElementById('questionType');
    const questionText = document.getElementById('questionText');
    const points = document.getElementById('points');
    const answersSection = document.getElementById('answersSection');
    const form = document.getElementById('questionForm');

    // Ensure the category option exists
    categorySelect.appendChild(new Option('Category 2', 'cat2'));

    questionType.value = 'multiple_choice';
    questionType.dispatchEvent(new Event('change'));
    categorySelect.value = 'cat2';
    questionText.value = 'What is 2+2?';
    points.value = '5';

    const rows = answersSection.querySelectorAll('.answer-row');
    rows[0].querySelector('input[name="answerText"]').value = '4';
    rows[0].querySelector('input[name="correctAnswer"]').checked = true;
    rows[1].querySelector('input[name="answerText"]').value = '5';

    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'q123' }) });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/questions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: 'cat2',
          question_type: 'multiple_choice',
          question_text: 'What is 2+2?',
          points: '5',
          answers: [
            { answer_text: '4', is_correct: true },
            { answer_text: '5', is_correct: false }
          ]
        })
      })
    );
    expect(global.alert).toHaveBeenCalledWith('Въпросът е създаден успешно!');
  });

  test('creates a true/false question', async () => {
    const categorySelect = document.getElementById('category');
    const questionType = document.getElementById('questionType');
    const questionText = document.getElementById('questionText');
    const points = document.getElementById('points');
    const form = document.getElementById('questionForm');

    // Ensure the category option exists
    categorySelect.appendChild(new Option('Category 1', 'cat1'));

    questionType.value = 'true_false';
    questionType.dispatchEvent(new Event('change'));
    categorySelect.value = 'cat1';
    questionText.value = 'Is the sky blue?';
    points.value = '2';

    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'qTF' }) });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/questions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: 'cat1',
          question_type: 'true_false',
          question_text: 'Is the sky blue?',
          points: '2',
          correct: 'Да'
        })
      })
    );
    expect(global.alert).toHaveBeenCalledWith('Въпросът е създаден успешно!');
  });

  test('creates an open text question', async () => {
    const categorySelect = document.getElementById('category');
    const questionType = document.getElementById('questionType');
    const questionText = document.getElementById('questionText');
    const points = document.getElementById('points');
    const form = document.getElementById('questionForm');

    // Ensure the category option exists
    categorySelect.appendChild(new Option('Category 2', 'cat2'));

    questionType.value = 'open_text';
    questionType.dispatchEvent(new Event('change'));
    categorySelect.value = 'cat2';
    questionText.value = 'Explain gravity.';
    points.value = '10';

    const openInput = document.getElementById('openAnswer');
    openInput.value = 'Force of attraction';

    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'qOpen' }) });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/questions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: 'cat2',
          question_type: 'open_text',
          question_text: 'Explain gravity.',
          points: '10',
          correct: 'Force of attraction'
        })
      })
    );
    expect(global.alert).toHaveBeenCalledWith('Въпросът е създаден успешно!');
  });
});
