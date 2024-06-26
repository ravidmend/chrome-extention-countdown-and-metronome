function addCountdownAndMetronome() {
  let metronomeInterval;
  let countdownInterval;
  let countdownElement;
  let audioCtx;
  let oscillator;

  function startCountdown(countdownValue) {
    countdownElement = document.createElement('div');
    countdownElement.id = 'countdown-timer';
    countdownElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-size: 48px;
      z-index: 9999;
    `;
    document.body.appendChild(countdownElement);
    countdownElement.innerText = countdownValue;

    const video = document.querySelector('video');
    if (video) {
      video.pause();
    }

    countdownInterval = setInterval(() => {
      countdownValue -= 1;
      countdownElement.innerText = countdownValue;
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        countdownElement.style.display = 'none';
        countdownButton.style.display = 'inline-block';
        cancelCountdownButton.style.display = 'none';
        if (video) {
          video.play();
        }
        const bpm = Math.max(0, Math.min(180, slider.value));
        startMetronome(bpm);
      }
    }, 1000);
  }

  function stopCountdown() {
    clearInterval(countdownInterval);
    if (countdownElement) countdownElement.style.display = 'none';
  }

  function startMetronome(bpm) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (metronomeInterval) clearInterval(metronomeInterval);
    const interval = 60000 / bpm;

    metronomeInterval = setInterval(() => {
      playTick();
    }, interval);

    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
  }

  function stopMetronome() {
    if (metronomeInterval) clearInterval(metronomeInterval);

    stopButton.style.display = 'none';
    startButton.style.display = 'inline-block';
  }

  function playTick() {
    if (!oscillator) {
      oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);

      oscillator.onended = () => {
        oscillator = null;
      };
    }
  }

  const metronomeElement = document.createElement('div');
  metronomeElement.id = 'metronome';
  metronomeElement.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 9999;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    width: 200px; /* Set a fixed width to prevent background expansion */
    height: 100px
  `;
  metronomeElement.innerHTML = `
    <input type="range" id="metronome-slider" min="0" max="180" value="120" style="margin-bottom: 10px;">
    <p>Metronome: <span id="bpm">120</span> BPM</p>
    <button id="start-metronome">Start Metronome</button>
    <button id="stop-metronome" style="display: none;">Stop Metronome</button>
    <button id="start-countdown">Start Countdown</button>
    <button id="cancel-countdown" style="display: none;">Cancel Countdown</button>
  `;
  document.body.appendChild(metronomeElement);

  const closeButton = document.createElement('button');
  closeButton.id = 'close-metronome';
  closeButton.style.cssText = `
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 10000;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  `;
  closeButton.innerHTML = '×';
  metronomeElement.appendChild(closeButton);

  const slider = document.getElementById('metronome-slider');
  const bpmDisplay = document.getElementById('bpm');
  const startButton = document.getElementById('start-metronome');
  const stopButton = document.getElementById('stop-metronome');
  const countdownButton = document.getElementById('start-countdown');
  const cancelCountdownButton = document.getElementById('cancel-countdown');

  slider.addEventListener('input', () => {
    const bpm = Math.max(0, Math.min(180, slider.value));
    bpmDisplay.innerText = bpm;
    chrome.storage.sync.set({ bpm: bpm });
  });

  startButton.addEventListener('click', () => {
    const bpm = Math.max(0, Math.min(180, slider.value));
    startMetronome(bpm);
  });

  stopButton.addEventListener('click', () => {
    stopMetronome();
  });

  countdownButton.addEventListener('click', () => {
    chrome.storage.sync.get('countdownTime', (data) => {
      if (data.countdownTime) {
        startCountdown(data.countdownTime);
        countdownButton.style.display = 'none';
        cancelCountdownButton.style.display = 'inline-block';
      }
    });
  });

  cancelCountdownButton.addEventListener('click', () => {
    stopCountdown();
    countdownButton.style.display = 'inline-block';
    cancelCountdownButton.style.display = 'none';
  });

  closeButton.addEventListener('click', () => {
    stopMetronome();
    metronomeElement.style.display = 'none';
    closeButton.style.display = 'none';
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setBPM') {
      const bpm = Math.max(0, Math.min(180, request.bpm));
      slider.value = bpm;
      bpmDisplay.innerText = bpm;
      //startMetronome(bpm);
    }

    if (request.action === 'showControlBar') {
      metronomeElement.style.display = 'inline-block';
      closeButton.style.display = 'inline-block';
    }
    
  });

  chrome.storage.sync.get(['bpm', 'countdownTime'], (data) => {
    if (data.bpm) {
      const bpm = Math.max(0, Math.min(180, data.bpm));
      slider.value = bpm;
      bpmDisplay.innerText = bpm;
    } else {
      slider.value = 120;
      bpmDisplay.innerText = 120;
    }

    if (!data.countdownTime) {
      chrome.storage.sync.set({ countdownTime: 5 });
    }
  });

  makeElementDraggable(metronomeElement, slider);
}

function makeElementDraggable(elmnt, slider) {
  let pos3 = 0, pos4 = 0;
  slider.onmousedown = stopDragging;////////////////
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX - elmnt.offsetLeft;
    pos4 = e.clientY - elmnt.offsetTop;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    let newTop = e.clientY - pos4;
    let newLeft = e.clientX - pos3;

    // Ensure the element stays within screen boundaries
    if (newTop < 0) newTop = 0;
    if (newLeft < 0) newLeft = 0;
    if (newTop + elmnt.offsetHeight > window.innerHeight) newTop = window.innerHeight - elmnt.offsetHeight;
    if (newLeft + elmnt.offsetWidth > window.innerWidth) newLeft = window.innerWidth - elmnt.offsetWidth;

    elmnt.style.top = newTop + "px";
    elmnt.style.left = newLeft + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
  function stopDragging(e) {
    e.stopPropagation();
  }
}

addCountdownAndMetronome();
