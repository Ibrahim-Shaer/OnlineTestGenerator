
const fs = require('fs');
const path = require('path');

describe('Manual Review Page', () => {
  let originalFetch;
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.resolve(__dirname, '../public/pages/review-test.html'), 
      'utf8'
    );
  });

  beforeEach(async () => {
    document.documentElement.innerHTML = html;

    // Mock URL
    const mockSearchParams = new URLSearchParams('assigned_id=123');
    jest.spyOn(window, 'URLSearchParams').mockImplementation(() => mockSearchParams);

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn();

    // Polyfill
    global.fetch.mockResolvedValueOnce = function (val) {
      this.mockImplementationOnce(() => Promise.resolve(val));
      return this;
    };

    // Bootstrap mocks (ако използваш модали и др.)
    global.alert = jest.fn();

    // Mock GET /assigned-tests/123/review
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        assigned: {
          test_title: 'Demo Test',
          student_username: 'ivan123',
          score: 5
        },
        questions: [
          {
            id: 'q1',
            question_text: 'Explain gravity.',
            question_type: 'open_text',
            answer_text: 'Some answer'
          }
        ]
      })
    });

    // Зареждаме скрипта
    require(path.resolve(__dirname, '../public/js/review-test.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('saves student review score', async () => {
    // Подаваме стойност в полето за оценка
    const input = document.querySelector('.open-score');
    input.value = '3';

    const saveBtn = document.getElementById('saveReviewBtn');

    // Подготвяме очакваната POST заявка
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Оценено успешно!' })
    });

    // Симулираме клик
    saveBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/assigned-tests/123/review',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openScores: [
            { question_id: 'q1', points: '3' }
          ]
        })
      })
    );
  });
});
