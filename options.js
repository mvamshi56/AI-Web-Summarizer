document.getElementById('save-btn').addEventListener('click', () => {
  const provider = document.getElementById('provider-select').value;
  const model = document.getElementById('model-id').value.trim();
  const key = document.getElementById('api-key').value.trim();

  chrome.storage.local.set({
    ai_provider: provider,
    ai_model: model,
    ai_key: key
  }, () => {
    const status = document.getElementById('status');
    status.innerText = "✅ Settings Saved!";
    setTimeout(() => { status.innerText = ""; }, 3000);
  });
});

chrome.storage.local.get(['ai_provider', 'ai_model', 'ai_key'], (data) => {
  if (data.ai_provider) document.getElementById('provider-select').value = data.ai_provider;
  if (data.ai_model) document.getElementById('model-id').value = data.ai_model;
  if (data.ai_key) document.getElementById('api-key').value = data.ai_key;
});