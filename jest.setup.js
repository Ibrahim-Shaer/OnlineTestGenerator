require('jest-fetch-mock').enableMocks();

const originalFetch = global.fetch;

global.fetch = (url, ...args) => {
  
  if (typeof url === 'string' && url.startsWith('/')) {
    url = 'http://localhost' + url;
  }
  return originalFetch(url, ...args);
};
