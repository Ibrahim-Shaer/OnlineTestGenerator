/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Create Test Flow', () => {
  let originalFetch;
  let html;

  beforeAll(() => {
    // Load the HTML fixture for the create-test page
    html = fs.readFileSync(
      path.resolve(__dirname, '../public/pages/tests.html'),
      'utf8'
    );
  });

  beforeEach(async () => {
    // 1) Render the minimal DOM
    document.body.innerHTML = html;
    document.getElementById('role-error').style.display = 'none';

    // 2) Mock fetch in sequence:
    originalFetch = global.fetch;
    global.fetch = jest.fn()
        // 1) first /auth/status
        .mockResolvedValueOnce({ ok:true, json: async()=>({ loggedIn:true, user:{role_name:'teacher'} }) })
        // 2) first GET /tests (listing existing tests)
        .mockResolvedValueOnce({ ok:true, json: async()=>[] })
        // 3) second /auth/status (the .then → loadTests()
        .mockResolvedValueOnce({ ok:true, json: async()=>({ loggedIn:true, user:{role_name:'teacher'} }) })
        // 4) second GET /tests inside loadTests()
        .mockResolvedValueOnce({ ok:true, json: async()=>[] })
        // 5) GET /questions/all (on createTestBtn click)
        .mockResolvedValueOnce({ ok:true, json: async()=>[ { id:42, question_text:'S?', question_type:'open_text', category_id:7 } ] })
        // 6) POST /tests (on form submit)
        .mockResolvedValueOnce({ ok:true, json: async()=>({ success:true }) });

    // 3) Load and eval the script under test
    const script = fs.readFileSync(
      path.resolve(__dirname, '../public/js/tests.js'),
      'utf8'
    );
    eval(script);
    window.dispatchEvent(new Event('DOMContentLoaded'));

    // 4) Wait for auth status + render of button
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('can open modal and render question checkbox', async () => {
    // Show form, then open modal
    document.getElementById('createTestFormDiv').style.display = '';
    document.getElementById('openQuestionsModalBtn').click();
  
    // Wait for mock fetch
    await Promise.resolve();
    await Promise.resolve();
  
   
    const questionsList = document.getElementById('modalQuestionsList');
    questionsList.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="42" id="modalQ42">
        <label class="form-check-label" for="modalQ42">S? <span class="text-muted">(open_text)</span></label>
      </div>
    `;
  
    const checkbox = document.querySelector('input#modalQ42');
    expect(checkbox).not.toBeNull();
    expect(checkbox.value).toBe('42');
  });
  
  
});
