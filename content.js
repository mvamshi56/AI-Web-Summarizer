chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getText") {
    const text = Array.from(document.querySelectorAll('p, li, article'))
      .map(el => el.innerText)
      .join('\n')
      .substring(0, 8000); // RAM-saving clip
    sendResponse({ text: text });
  }
  return true;
});