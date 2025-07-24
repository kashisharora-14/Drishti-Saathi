
const phrases = [
  "Your Voice Companion for Learning & Joy",
  "Built Especially for Blind Children",
  "Speak. Learn. Smile."
];

let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
const speed = 100; 
const delay = 2000; 
const typewriterElement = document.getElementById("typewriterText");

function typeEffect() {
  const currentPhrase = phrases[currentPhraseIndex];
  if (isDeleting) {
    currentCharIndex--;
  } else {
    currentCharIndex++;
  }

  typewriterElement.textContent = currentPhrase.substring(0, currentCharIndex);

  if (!isDeleting && currentCharIndex === currentPhrase.length) {
    isDeleting = true;
    setTimeout(typeEffect, delay);
  } else if (isDeleting && currentCharIndex === 0) {
    isDeleting = false;
    currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
    setTimeout(typeEffect, 500);
  } else {
    setTimeout(typeEffect, isDeleting ? speed / 2 : speed);
  }
}

typeEffect();




const VOICE_MAP = {
  "hi-IN": "female", 
  "en-US": "male"    
};
let currentAudio = null;
let hasLanguageBeenSelected = false;
let welcomeRepeatTimeout = null;
let selectedLang = null; 
let isLongReplyMode = false;
let isConversationEnded = false;
let currentContext = null;
let micTimeout = null;
let isAppSpeaking = false;
let hasGreeted = false;
let fullConversation = [];
let isProcessingReply = false;


function setLanguage(lang) {
  speechSynthesis.cancel();

  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    isAppSpeaking = false;
  }

  stopListening();

  if (selectedLang === lang) return;

  hasLanguageBeenSelected = true;
  selectedLang = lang;
  clearTimeout(welcomeRepeatTimeout);

  const langInput = document.getElementById("languageSelect");
  langInput.value = lang;
  langInput.dispatchEvent(new Event("change"));
}

const indicator = document.getElementById("micIndicator");
const statusTxt = document.getElementById("listeningStatus");
const userDiv = document.getElementById("userSpokenText");
const outDiv = document.getElementById("output");
const languageSelect = document.getElementById("languageSelect");
console.log(languageSelect)

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;
let isListening = false;

function startListening() {
  if (isListening || isAppSpeaking) return; 
  try {
    recognition.start();
    isListening = true;
    indicator.classList.add("listening");
    statusTxt.textContent = "🎙️ Mic on";
    statusTxt.style.color = "green";

    micTimeout && clearTimeout(micTimeout);
    micTimeout = setTimeout(stopListening, 15000);
  } catch (e) {
    console.error("Mic start error:", e.message);
  }
}

function checkForGoodbye(text) {
  const goodbyePhrases = ["bye", "goodbye", "ok bye", "बाय", "अलविदा", "ठीक है बाय", "tata", "going", "see you later", "take care",
    "see you soon", "catch you later", "talk to you later", "have a nice day", "have a good day", "i am leaving", "i am going", "i am off", "i am done"];
  return goodbyePhrases.some(phrase => text.toLowerCase().includes(phrase));
}

function stopListening() {
  if (!isListening) return;
  recognition.stop();
  isListening = false;
  indicator.classList.remove("listening");
  statusTxt.textContent = "🔴 Mic off";
  statusTxt.style.color = "red";
  micTimeout && clearTimeout(micTimeout);
}

languageSelect.addEventListener("change", e => {
  const lang = e.target.value;
  recognition.lang = lang;

  const introText = lang === "hi-IN"
    ? "नमस्ते मेरे प्यारे दोस्त! मैं दृष्टि साथी हूँ — आपकी आवाज़ आधारित साथी जो सीखने, खेलने और मुस्कुराने में मदद करेगी। बस बोलिए, मैं सुन रही हूँ।"
    : "Hello my dear friend! I'm Drishti Saathi — your voice-powered companion to help you learn, play, and smile. Just speak to me, I'm listening.";

  speakWithMurf(introText, lang, () => {
    if (!hasGreeted) {
      hasGreeted = true;
      startListening();
    }
  });
});


function speakWithBrowserTTS(text, lang, onEnd) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.onend = () => onEnd && onEnd();
  window.speechSynthesis.speak(u);
}

window.addEventListener("DOMContentLoaded", () => {
  const initialGreeting = "Welcome to Drishti Saathi . Please select your preferred language using the buttons above to begin.";
  speakWithBrowserTTS(initialGreeting, "en-US");

  welcomeRepeatTimeout = setTimeout(() => {
    if (!hasLanguageBeenSelected) {
      speakWithBrowserTTS("Please tap English or Hindi to begin.", "en-US");
    }
  }, 10000);
});


recognition.onresult = e => {
  if (isAppSpeaking) return; 

  clearTimeout(micTimeout);
  const transcript = e.results[0][0].transcript.trim().toLowerCase();
  userDiv.textContent = transcript;
  stopListening(); 
  handleInput(transcript);
};

recognition.onend = () => {
  isListening = false;
  indicator.classList.remove("listening");
  statusTxt.textContent = "🔴 Mic off";
  statusTxt.style.color = "red";
};

async function handleInput(text) {
  const lang = recognition.lang;
  fullConversation.push({ role: "user", text });

  if (!hasGreeted && (text.includes("hello") || text.includes("नमस्ते"))) {
    hasGreeted = true;
    const greeting = lang === "hi-IN"
      ? "नमस्ते! आप आज कैसे महसूस कर रहे हैं?"
      : "Hello! How are you feeling today?";
    fullConversation.push({ role: "bot", text: greeting });
    await speakWithMurf(greeting, lang);
    return;
  }

  const byePhrases = ["bye", "goodbye", "ok bye", "बाय", "अलविदा", "ठीक है बाय"];
  const isGoodbye = byePhrases.some(phrase => text.toLowerCase().includes(phrase));
  if (isGoodbye) {
    const byeMsg = lang === "hi-IN"
      ? "अलविदा मेरे प्यारे दोस्त! अपना ख्याल रखना, फिर जल्दी मिलेंगे।"
      : "Goodbye my dear friend! Take care of yourself, and we’ll talk again very soon.";

    fullConversation.push({ role: "bot", text: byeMsg });
    userDiv.textContent = text; 
    outDiv.textContent = byeMsg;
    isConversationEnded = true; 
    await speakWithMurf(byeMsg, lang);
    return;
  }


  const conversationText = fullConversation.map(turn =>
    `${turn.role === "user" ? "Child" : "Bot"}: ${turn.text}`
  ).join("\n");

  const prompt = `
You are a warm, intelligent, and caring teacher talking to a blind child.

At the start of the conversation, ask their name and how they are feeling.

ONLY respond in ${lang === "hi-IN" ? "Hindi" : "English"}.
DO NOT include translations, brackets, or switch languages.

Here is the full conversation so far:
${conversationText}

Continue the conversation naturally, building on the last message.
Respond in a way that acknowledges what the child just said or asked.

If the child asks for:
- a joke → tell a fun, simple joke.
- a story → share a complete, imaginative story with a beginning, middle, and end. Make it engaging and descriptive. Do not summarize.
- a shayari → speak a gentle, poetic shayari.
- a quiz → first ask what kind of quiz they want (fun, general knowledge, academic), then wait for their answer.
- to learn something → explain clearly like a kind teacher.
- to relax → guide them through calming words or breathing.
- if they express sadness or fear → comfort them gently.
- if they say "bye" → say goodbye warmly and stop interaction.

For all other replies, keep them short, kind, and clear.
`;

  await fetchGemini(prompt, lang);
}

async function fetchGemini(prompt, lang) {
  if (isProcessingReply) return; 
  isProcessingReply = true;
  outDiv.innerHTML = `<div style="color: gray;">🤔 Thinking...</div>`; 

  try {
    const res = await fetch("http://localhost:3000/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (data?.error || res.status >= 400) {
      console.error("Gemini API error:", data?.error || res.statusText);
      outDiv.textContent = "Gemini is overloaded or unavailable. Please try again shortly.";
      isAppSpeaking = false;
      stopListening(); 
      return;
    }



    const replyText = data?.reply || "Sorry, I didn't get that..There might be an issue with the server.";
    isLongReplyMode = replyText.length > 200;

    // 👉 Show the reply immediately before speaking
    if (replyText.length > 300) {
      outDiv.innerHTML = `
        <div id="collapsedText">${replyText.slice(0, 300)}...</div>
        <button id="toggleBtn">Show More</button>
      `;

      document.getElementById("toggleBtn").onclick = () => {
        const collapsed = document.getElementById("collapsedText");
        const btn = document.getElementById("toggleBtn");

        if (btn.textContent === "Show More") {
          collapsed.textContent = replyText;
          btn.textContent = "Show Less";
        } else {
          collapsed.textContent = replyText.slice(0, 300) + "...";
          btn.textContent = "Show More";
        }
      };
    } else {
      outDiv.textContent = replyText;
    }

    fullConversation.push({ role: "bot", text: replyText });

    await speakWithMurf(replyText, lang); 
  } catch (e) {
    console.error("Gemini API error:", e.message);
    outDiv.textContent = "There was an error contacting the server.";
    stopListening(); 
    isAppSpeaking = false;
  }
  finally {
    isProcessingReply = false; 
  }
}


async function speakWithMurf(text, lang) {
  const voiceType = VOICE_MAP[lang] || "female"; isAppSpeaking = true;
  try {
    const res = await fetch("http://localhost:3000/api/murf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceType })
    });
    const { audioUrl } = await res.json();
    const audio = new Audio(audioUrl);
    currentAudio = audio; 
    audio.onended = () => {
      isAppSpeaking = false;
      if (!isConversationEnded) {
        startListening();
      } else {
        stopListening();
        recognition.abort();
        recognition.onresult = null;
      }
    };
    audio.onerror = () => {
      isAppSpeaking = false;
      fallbackSpeak(text, lang);
    };
    audio.play();
  } catch {
    isAppSpeaking = false;
    fallbackSpeak(text, lang);
  }
}

function fallbackSpeak(text, lang) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.onend = () => {
    isAppSpeaking = false;
    startListening();
  };
  speechSynthesis.speak(u);
}

document.getElementById("stopBtn").addEventListener("click", () => {
  stopListening(); 

  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  document.getElementById("userSpokenText").textContent = "";
  document.getElementById("output").textContent = "";
  isAppSpeaking = false;
  isProcessingReply = false;
  console.log("🔴 Assistant stopped.");
});

document.getElementById("restartBtn").addEventListener("click", () => {
  stopListening();
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  document.getElementById("userSpokenText").textContent = "";
  document.getElementById("output").textContent = "";
  isAppSpeaking = false;
  isProcessingReply = false;
  isConversationEnded = false;
  fullConversation = [];

  const lang = selectedLang || "en-US";
  const greeting = lang === "hi-IN"
    ? "नमस्ते मेरे प्यारे दोस्त! मैं दृष्टि साथी हूँ — आपकी आवाज़ आधारित साथी जो सीखने, खेलने और मुस्कुराने में मदद करेगी। बस बोलिए, मैं सुन रही हूँ।"
    : "Hello my dear friend! I'm Drishti Saathi — your voice-powered companion to help you learn, play, and smile. Just speak to me, I'm listening.";

  speakWithMurf(greeting, lang);
});

document.getElementById("pauseBtn").onclick = () => {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }
};

document.getElementById("resumeBtn").onclick = () => {
  if (currentAudio && currentAudio.paused) {
    currentAudio.play();
  }
};
