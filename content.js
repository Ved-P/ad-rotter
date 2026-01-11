// ================================
// Persistent Ads Cooked Counter
// ================================

let adsReplacedCount = 0;

function loadAdsCookedCount() {
  return new Promise(resolve => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get({ brainrot_ads_cooked: 0 }, data => {
        adsReplacedCount = data.brainrot_ads_cooked || 0;
        resolve();
      });
    } else {
      adsReplacedCount = parseInt(localStorage.getItem("brainrot_ads_cooked") || "0");
      resolve();
    }
  });
}

function saveAdsCookedCount() {
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ brainrot_ads_cooked: adsReplacedCount });
  } else {
    localStorage.setItem("brainrot_ads_cooked", adsReplacedCount);
  }
}

function createHUD() {
  if (document.getElementById("brainrot-hud")) return;

  const hud = document.createElement("div");
  hud.id = "brainrot-hud";
  hud.className = "brainrot-hud";
  hud.style.position = "fixed";
  hud.style.bottom = "20px";
  hud.style.right = "20px";
  hud.style.padding = "12px 20px";
  hud.style.borderRadius = "999px";
  hud.style.fontWeight = "bold";
  hud.style.fontSize = "20px";
  hud.style.zIndex = "999999";
  hud.style.pointerEvents = "none";
  hud.style.background = "white";
  hud.style.boxShadow = "3px 3px 8px rgba(0,0,0,0.45)";
  hud.style.transform = "none";

  const span = document.createElement("span");
  span.className = "brainrot-hud-text";
  span.textContent = `ads cooked: ${adsReplacedCount}`;

  hud.appendChild(span);
  document.body.appendChild(hud);
}

function updateHUD() {
  const hud = document.getElementById("brainrot-hud");
  if (hud) {
    hud.querySelector(".brainrot-hud-text").textContent = `ads cooked: ${adsReplacedCount}`;
  }
}

// ================================
// CSS-only jitter & HUD rainbow
// ================================

(function injectCSS() {
  if (document.getElementById("brainrot-jitter-style")) return;

  const style = document.createElement("style");
  style.id = "brainrot-jitter-style";
  style.textContent = `
    @keyframes brainrot-jitter {
      0%   { transform: translate(0px, 0px) rotate(0deg); }
      20%  { transform: translate(1px, -1px) rotate(0.5deg); }
      40%  { transform: translate(-1px, 1px) rotate(-0.5deg); }
      60%  { transform: translate(2px, 0px) rotate(0.8deg); }
      80%  { transform: translate(-1px, -2px) rotate(-0.8deg); }
      100% { transform: translate(0px, 0px) rotate(0deg); }
    }

    .brainrot-jitter {
      animation: brainrot-jitter 0.8s infinite alternate ease-in-out;
      will-change: transform;
    }

    .brainrot-hud-text {
      display: inline-block;
      font-weight: bold;
      background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
      background-size: 400% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: rainbow-text 4s linear infinite;
    }

    @keyframes rainbow-text {
      0%   { background-position: 0% 0%; }
      50%  { background-position: 100% 0%; }
      100% { background-position: 0% 0%; }
    }

    .brainrot-hud {
      animation: brainrot-jitter 1.2s infinite alternate ease-in-out;
    }
  `;
  document.head.appendChild(style);
})();

// ================================
// Single LLM call
// ================================

async function getMemeWords() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: 'Bearer [OPENROUTER_API_KEY]',
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [{
          role: "user",
          content: `
            You are given the full text content of a website. First, reason about the type of website
            or its topic. Then, generate exactly 5 single-word nouns that are lowercase, relevant
            to the website's topic, and feel appropriate in a brainrot meme.

            Output all 5 words on the same line, separated only by a single space.
          ` + "\n\n" + document.body.innerText
        }]
      }),
    });

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim().split(" ");
  } catch {
    return ["brain", "rot", "meme", "fun", "weird"];
  }
}

// ================================
// Ad handling
// ================================

function isAdDiv(div) {
  return Array.from(div.classList).some(cls => {
    const c = cls.toLowerCase();
    return c.startsWith("ad") || c.includes("-ad");
  });
}

function isAlreadyProcessed(div) {
  return div.dataset.brainrotProcessed === "true";
}

function markProcessed(div) {
  div.dataset.brainrotProcessed = "true";
}

function applyDivStyles(div) {
  div.style.setProperty("display", "block", "important");
  div.style.setProperty("position", "relative", "important");
  div.style.setProperty("min-height", "250px", "important");
  div.style.setProperty("background", "black", "important");
  div.style.setProperty("overflow", "hidden", "important");
}

function processSingleAdDiv(div, memeWords) {
  if (!isAdDiv(div) || isAlreadyProcessed(div)) return;

  let parent = div.parentElement;
  while (parent) {
    if (parent.tagName === "DIV" && isAdDiv(parent)) return;
    parent = parent.parentElement;
  }

  markProcessed(div);

  adsReplacedCount++;
  saveAdsCookedCount();
  updateHUD();

  applyDivStyles(div);

  const gifNum = Math.floor(Math.random() * 5) + 1;
  const word = memeWords[Math.floor(Math.random() * memeWords.length)] + ".";

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL(`subwaysurfers/${gifNum}.gif`);
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";

  // CENTERING FIX: outer div centers, inner div jitters
  const overlayWrapper = document.createElement("div");
  overlayWrapper.style.position = "absolute";
  overlayWrapper.style.top = "50%";
  overlayWrapper.style.left = "50%";
  overlayWrapper.style.transform = "translate(-50%, -50%)"; // perfect center
  overlayWrapper.style.pointerEvents = "none";

  const overlay = document.createElement("div");
  overlay.className = "brainrot-jitter";
  overlay.textContent = word;
  overlay.style.color = "black";
  overlay.style.fontSize = "40px";
  overlay.style.fontWeight = "bold";
  overlay.style.background = "white";
  overlay.style.padding = "8px 16px";
  overlay.style.borderRadius = "12px";
  overlay.style.boxShadow = "2px 2px 6px rgba(0,0,0,0.5)";

  overlayWrapper.appendChild(overlay);

  div.innerHTML = "";
  div.appendChild(img);
  div.appendChild(overlayWrapper);
}

// ================================
// DOM observers
// ================================

function processExistingAds(words) {
  document.querySelectorAll("div").forEach(div =>
    processSingleAdDiv(div, words)
  );
}

function observeNewAds(words) {
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.tagName === "DIV") processSingleAdDiv(node, words);
        node.querySelectorAll?.("div").forEach(d => processSingleAdDiv(d, words));
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ================================
// Main
// ================================

async function processAds() {
  await loadAdsCookedCount();
  createHUD();
  updateHUD();

  const words = await getMemeWords();
  processExistingAds(words);
  observeNewAds(words);
}

processAds();
