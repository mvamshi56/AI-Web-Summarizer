document.getElementById('save-btn').addEventListener('click', () => {
  const key = document.getElementById('api-key').value;
  chrome.storage.local.set({ groq_api_key: key }, () => {
    document.getElementById('status').innerText = "Settings Saved!";
  });
});

chrome.storage.local.get('groq_api_key', (data) => {
  if (data.groq_api_key) document.getElementById('api-key').value = data.groq_api_key;
});