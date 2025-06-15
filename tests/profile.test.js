/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Profile Page', () => {
  let originalFetch;
  let html;

  beforeAll(() => {
    // Load HTML fixture
    html = fs.readFileSync(
      path.resolve(__dirname, '../public/pages/profile.html'),
      'utf8'
    );
  });

  beforeEach(() => {
    // Set up DOM
    document.documentElement.innerHTML = html;

    // Mock fetch for status endpoint
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    const statusResponse = {
      ok: true,
      json: () => Promise.resolve({
        loggedIn: true,
        user: {
          avatar: '/images/default-avatar.png',
          username: 'user',
          role_name: 'student',
          email: 'user@example.com'
        }
      })
    };
    // First fetch call: /auth/status
    global.fetch.mockResolvedValueOnce(statusResponse);

    // Mock Date.now for consistent timestamp
    jest.spyOn(Date, 'now').mockReturnValue(1620000000000);

    // Load the script under test and trigger event
    require(path.resolve(__dirname, '../public/js/profile.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    // Restore mocks and clear require cache
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('uploads avatar and shows success alert on successful response', async () => {
    const file = new File(['avatar-content'], 'avatar.png', { type: 'image/png' });
    const avatarInput = document.getElementById('avatarInput');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const alertBox = document.getElementById('alertBox');
    const profileAvatar = document.getElementById('profileAvatar');

    // Next fetch call: /auth/upload-avatar
    const mockUploadRes = {
      ok: true,
      json: () => Promise.resolve({ avatar: '/uploads/avatar.png' })
    };
    global.fetch.mockResolvedValueOnce(mockUploadRes);

    // Simulate user clicking upload and selecting file
    avatarUploadBtn.click();
    Object.defineProperty(avatarInput, 'files', { value: [file] });
    avatarInput.dispatchEvent(new Event('change'));

    // Await async handlers
    await Promise.resolve();
    await Promise.resolve();

    // Check fetch called for upload
    expect(global.fetch).toHaveBeenCalledWith(
      '/auth/upload-avatar',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );

    // UI updates
    expect(profileAvatar.src).toContain('/uploads/avatar.png?t=1620000000000');
    expect(alertBox.innerHTML).toMatch(/Снимката е качена успешно/);
  });

  test('updates profile and shows success alert on successful response', async () => {
    const usernameInput = document.getElementById('editUsername');
    const emailInput = document.getElementById('editEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const profileEditForm = document.getElementById('profileEditForm');
    const profileUsernameDisplay = document.getElementById('profileUsername');
    const alertBox = document.getElementById('profileEditAlert');

    // Next fetch call: /auth/update-profile
    const mockUpdateRes = {
      ok: true,
      json: () => Promise.resolve({ message: 'Updated' })
    };
    global.fetch.mockResolvedValueOnce(mockUpdateRes);

    // Set form values
    usernameInput.value = 'newUser';
    emailInput.value = 'new@example.com';
    newPasswordInput.value = 'secret';
    confirmPasswordInput.value = 'secret';

    // Submit form
    profileEditForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Await async handlers
    await Promise.resolve();
    await Promise.resolve();

    // Check fetch call for update
    expect(global.fetch).toHaveBeenCalledWith(
      '/auth/update-profile',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newUser', email: 'new@example.com', newPassword: 'secret' })
      })
    );

    // UI updates
    expect(alertBox.innerHTML).toMatch(/Данните са обновени успешно/);
    expect(profileUsernameDisplay.textContent).toBe('newUser');
  });
});
