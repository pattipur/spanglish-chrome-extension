let percent = 0.2;
let paused = false;
const cache = {}; // To avoid redundant translations

function getTextNodes(node) {
  let textNodes = [];
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT','STYLE','NOSCRIPT','IFRAME','CANVAS'].includes(node.tagName)) {
    for (let child of node.childNodes) {
      textNodes = textNodes.concat(getTextNodes(child));
    }
  }
  return textNodes;
}

// Asynchronously translate a word with Google Translate API (public endpoint example)
async function translateWord(word) {
  if (cache[word]) return cache[word];
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(word)}`;
    const response = await fetch(url);
    const data = await response.json();
    let translation = data[0][0][0];
    if (translation.toLowerCase() === word.toLowerCase()) return word;
    cache[word] = translation;
    return translation;
  } catch (err) {
    return word;
  }
}

async function spanglifyTextAsync(text) {
  const words = text.split(/\b/);
  let promises = words.map(async (w, i) => {
    if (/^[a-zA-Z]+$/.test(w) && Math.random() < percent) {
      return await translateWord(w);
    }
    return w;
  });
  let translated = await Promise.all(promises);
  return translated.join('');
}

async function spanglifyPageAsync() {
  if (paused) return;
  const nodes = getTextNodes(document.body);
  for (let node of nodes) {
    if (node.parentNode && node.nodeValue.trim().length > 1) {
      let newText = await spanglifyTextAsync(node.nodeValue);
      node.nodeValue = newText;
    }
  }
}

chrome.storage.local.get(['percent', 'paused'], function(result) {
  if (typeof result.percent === "number") percent = result.percent;
  paused = !!result.paused;
  spanglifyPageAsync();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "updatePercent") {
    percent = msg.value;
    spanglifyPageAsync();
  }
  if (msg.type === "updatePaused") {
    paused = msg.value;
    spanglifyPageAsync();
  }
});
