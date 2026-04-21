document.getElementById('summarize-btn').addEventListener('click', async () => {
  const output = document.getElementById('output');
  const sumBtn = document.getElementById('summarize-btn');
  const copyBtn = document.getElementById('copy-btn');

  const settings = await chrome.storage.local.get(['ai_provider', 'ai_model', 'ai_key']);
  
  if (!settings.ai_key || !settings.ai_model) {
    output.innerText = "⚠️ Please configure your API Key and Model ID in Settings.";
    return;
  }

  output.innerText = `Connecting to ${settings.ai_provider}...`;
  sumBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({ 
      target: { tabId: tab.id }, 
      files: ['content.js'] 
    });

    chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {
      if (!response || !response.text) {
        output.innerText = "Error: Could not read page content.";
        sumBtn.disabled = false;
        return;
      }

      const pageText = response.text.substring(0, 5000); // Limit text for 4GB RAM safety
      let apiUrl = "";
      let headers = { "Content-Type": "application/json" };
      let body = {};

      // CONFIGURATION SWITCHBOARD
      if (settings.ai_provider === "groq" || settings.ai_provider === "openai") {
        apiUrl = settings.ai_provider === "groq" 
          ? "https://api.groq.com/openai/v1/chat/completions" 
          : "https://api.openai.com/v1/chat/completions";
        
        headers["Authorization"] = `Bearer ${settings.ai_key}`;
        body = {
          model: settings.ai_model,
          messages: [
            { role: "system", content: "Summarize this into 5 concise bullet points." },
            { role: "user", content: pageText }
          ]
        };
      } 
      else if (settings.ai_provider === "gemini") {
        // Fix for Gemini URL structure
        const cleanModel = settings.ai_model.includes("models/") ? settings.ai_model : `models/${settings.ai_model}`;
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${settings.ai_key}`;
        
        body = {
          contents: [{ 
            parts: [{ text: "Summarize this page into 5 concise bullet points: " + pageText }] 
          }]
        };
      }

      // API FETCH
      try {
        const apiRes = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body)
        });

        const json = await apiRes.json();
        let finalSummary = "";

        if (settings.ai_provider === "gemini") {
          if (json.candidates && json.candidates[0]?.content?.parts?.[0]) {
            finalSummary = json.candidates[0].content.parts[0].text;
          } else {
            throw new Error(json.error?.message || "Gemini API Error. Check your key/model.");
          }
        } else {
          if (json.choices && json.choices[0]?.message?.content) {
            finalSummary = json.choices[0].message.content;
          } else {
            throw new Error(json.error?.message || "OpenAI/Groq API Error. Check your key/model.");
          }
        }

        output.innerText = finalSummary;
        copyBtn.disabled = false;
      } catch (err) {
        output.innerText = "API Error: " + err.message;
      } finally {
        sumBtn.disabled = false;
      }
    });
  } catch (e) {
    output.innerText = "System Error: " + e.message;
    sumBtn.disabled = false;
  }
});

// Copy and Options logic
document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('output').innerText);
  document.getElementById('copy-btn').innerText = "Copied!";
  setTimeout(() => document.getElementById('copy-btn').innerText = "Copy Summary", 2000);
});