// popup.js
document.getElementById('countdown-time').addEventListener('input', () => {
  const countdownTime = document.getElementById('countdown-time').value;
  chrome.storage.sync.set({ countdownTime: countdownTime });
});

document.getElementById('bpm-input').addEventListener('input', () => {
  const bpm = document.getElementById('bpm-input').value;
  chrome.storage.sync.set({ bpm: bpm });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'setBPM', bpm: bpm });
  });
});

document.getElementById('show-control-bar').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'showControlBar'});
  });
});


document.addEventListener('DOMContentLoaded', function() {
  const countdownTimeInput = document.getElementById('countdown-time');
  const bpmInput = document.getElementById('bpm-input');

  // Load saved settings
  chrome.storage.sync.get(['countdownTime', 'bpm'], function(data) {
    if (data.countdownTime !== undefined) {
      countdownTimeInput.value = data.countdownTime;
    } else {
      countdownTimeInput.value = 5;
    }

    if (data.bpm !== undefined) {
      bpmInput.value = data.bpm;
    } else {
      bpmInput.value = 120;
    }
  });

  // Save settings on input change
  countdownTimeInput.addEventListener('input', function() {
    const countdownTime = parseInt(countdownTimeInput.value, 10);
    chrome.storage.sync.set({ countdownTime: countdownTime });
  });

  bpmInput.addEventListener('input', function() {
    let bpm = parseInt(bpmInput.value, 10);
    if (isNaN(bpm) || bpm < 0) bpm = 0;
    if (bpm > 180) bpm = 180;
    bpmInput.value = bpm;
    chrome.storage.sync.set({ bpm: bpm });
    chrome.runtime.sendMessage({ action: 'setBPM', bpm: bpm });
  });
});

