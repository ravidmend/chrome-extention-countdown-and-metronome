chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchBPM') {
    fetchBPM(message.videoUrl).then(bpm => {
      sendResponse({ bpm });
    }).catch(error => {
      console.error(error);
      sendResponse({ error: 'Failed to fetch BPM' });
    });
    return true; // Will respond asynchronously
  }
});

async function fetchBPM(videoUrl) {
  const bpmFinderUrl = `https://bpmfinder.app/result/${videoUrl}`;
  const response = await fetch(bpmFinderUrl);
  const text = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  const bpmElement = doc.querySelector('.text-sm xs:text-sm md:text-lg.font-bold'); // Adjust the selector based on your actual element
  if (bpmElement) {
    return parseInt(bpmElement.textContent);
  } else {
    throw new Error('BPM not found');
  }
}
