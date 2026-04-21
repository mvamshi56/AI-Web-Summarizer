document.getElementById('summarize-btn').addEventListener('click', async () => {
  const output = document.getElementById('output');
  const sumBtn = document.getElementById('summarize-btn');
  const copyBtn = document.getElementById('copy-btn');

  const settings = await chrome.storage.local.get(['ai_provider', 'ai_model', 'ai_key']);
  if (!settings.ai_key || !settings.ai_model) {
    output.innerText = "Missing Settings! Please enter Key and Model ID.";
    return chrome.runtime.openOptionsPage();
  }

  output.innerText = "Connecting to " + settings.ai_provider + "...";
  sumBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

    chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {
      const pageText = response.text;
      let apiUrl = "";
      let headers = { "Content-Type": "application/json" };
      let body = {};

      // CONFIGURING THE API REQUEST
      if (settings.ai_provider === "groq" || settings.ai_provider === "openai") {
        apiUrl = settings.ai_provider === "groq" 
          ? "https://api.groq.com/openai/v1/chat/completions" 
          : "https://api.openai.com/v1/chat/completions";
        
        headers["Authorization"] = `Bearer ${settings.ai_key}`;
        body = {
          model: settings.ai_model,
          messages: [
            { role: "system", content: "Summarize this into 5 bullet points." },
            { role: "user", content: pageText }
          ]
        };
      } 
      else if (settings.ai_provider === "gemini") {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${settings.ai_model}:generateContent?key=${settings.ai_key}`;
        body = {
          contents: [{ parts: [{ text: "Summarize this page into 5 concise bullet points: " + pageText }] }]
        };
      }

      // SENDING THE REQUEST
      const apiRes = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      const json = await apiRes.json();
      
      // PARSING THE RESPONSE
      let finalSummary = "";
      if (settings.ai_provider === "gemini") {
        finalSummary = json.candidates[0].content.parts[0].text;
      } else {
        finalSummary = json.choices[0].message.content;
      }

      output.innerText = finalSummary;
      copyBtn.disabled = false;
      sumBtn.disabled = false;
    });
  } catch (e) {
    output.innerText = "Error: " + e.message;
    sumBtn.disabled = false;
  }
});

// Settings & Copy logic remain same as previous version
document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('output').innerText);
  document.getElementById('copy-btn').innerText = "Copied!";
  setTimeout(() => document.getElementById('copy-btn').innerText = "Copy", 2000);
});