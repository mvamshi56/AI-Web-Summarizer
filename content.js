chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getText") {
    // Grabs text only from paragraphs and headers to reduce noise
    const bodyText = Array.from(document.querySelectorAll('p, h1, h2, h3'))
                          .map(el => el.innerText)
                          .join('\n');
    sendResponse({ text: bodyText });
  }
});