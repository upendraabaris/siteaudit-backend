const isSocialUrl = (url) => /facebook\.com|linkedin\.com|twitter\.com|instagram\.com/.test(url);

function processStatus(resource, status, errorMsg) {
  const isSocial = isSocialUrl(resource.url);
  
  if (isSocial && (status === 403 || status === 999 || status === 401 || status === 400 || status === 405)) {
    return { ...resource, ok: true, status, note: 'Social media bot protection (likely valid)' };
  }

  const ok = status > 0 && status < 400;
  return { 
    ...resource, 
    ok, 
    status: status || null, 
    error: ok ? null : (errorMsg || `Status ${status}`),
    note: status === 404 ? 'Page not found' : null
  };
}

const tests = [
  { url: 'https://www.facebook.com/profile.php?id=123', status: 400, expectedOk: true },
  { url: 'https://www.facebook.com/profile.php?id=123', status: 405, expectedOk: true },
  { url: 'https://www.facebook.com/profile.php?id=123', status: 200, expectedOk: true },
  { url: 'https://www.google.com', status: 400, expectedOk: false },
  { url: 'https://www.google.com', status: 200, expectedOk: true },
  { url: 'https://twitter.com/user', status: 999, expectedOk: true },
  { url: 'https://example.com/notfound', status: 404, expectedOk: false },
];

tests.forEach((test, i) => {
  const result = processStatus({ url: test.url }, test.status);
  const passed = result.ok === test.expectedOk;
  console.log(`Test ${i+1}: ${test.url} (Status: ${test.status}) - ${passed ? 'PASSED' : 'FAILED'} (Got ok: ${result.ok})`);
});
