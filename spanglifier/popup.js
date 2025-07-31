const slider = document.getElementById('slider');
const percentLabel = document.getElementById('percent');
const pauseBtn = document.getElementById('pauseBtn');

chrome.storage.local.get(['percent', 'paused'], function(result) {
  slider.value = result.percent || 0.2;
  percentLabel.textContent = Math.round((slider.value || 0.2) * 100) + "%";
  pauseBtn.textContent = result.paused ? "Resume" : "Pause";
});

slider.oninput = function() {
  let val = parseFloat(this.value);
  percentLabel.textContent = Math.round(val * 100) + "%";
  chrome.storage.local.set({percent: val});
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "updatePercent", value: val});
  });
};

pauseBtn.onclick = function() {
  chrome.storage.local.get(['paused'], function(result) {
    const paused = !result.paused;
    chrome.storage.local.set({paused});
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: "updatePaused", value: paused});
    });
  });
};
