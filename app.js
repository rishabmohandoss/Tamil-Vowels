// Initialize Lucide Icons
lucide.createIcons();

// --- Optimized Data Matrix: Expanded Match Arrays & Cleaned Metadata ---
const vowelsData = [
    { id: 'v1',  char: 'அ', phonetic: 'A',  matches: ['அ', 'அ', 'a', 'ah', 'uh'] },
    { id: 'v2',  char: 'ஆ', phonetic: 'AA', matches: ['ஆ', 'aa', 'aah', 'ha'] },
    { id: 'v3',  char: 'இ', phonetic: 'I',  matches: ['இ', 'i', 'ee', 'e'] },
    { id: 'v4',  char: 'ஈ', phonetic: 'II', matches: ['ஈ', 'ii', 'eee', 'yi'] },
    { id: 'v5',  char: 'உ', phonetic: 'U',  matches: ['உ', 'u', 'oo', 'ou'] },
    { id: 'v6',  char: 'ஊ', phonetic: 'UU', matches: ['ஊ', 'uu', 'ooo'] },
    { id: 'v7',  char: 'எ', phonetic: 'E',  matches: ['எ', 'e', 'eh'] },
    { id: 'v8',  char: 'ஏ', phonetic: 'EE', matches: ['ஏ', 'ee', 'ay', 'ae'] },
    { id: 'v9',  char: 'ஐ', phonetic: 'AI', matches: ['ஐ', 'ai', 'i', 'vibe'] }, // 'vibe' or 'ai' can trigger on partials
    { id: 'v10', char: 'ஒ', phonetic: 'O',  matches: ['ஒ', 'o', 'oh'] },
    { id: 'v11', char: 'ஓ', phonetic: 'OO', matches: ['ஓ', 'oo', 'ooh'] },
    { id: 'v12', char: 'ஔ', phonetic: 'AU', matches: ['ஔ', 'au', 'ow', 'av'] }
];

// --- DOM Elements ---
const gridContainer = document.getElementById('vowel-grid');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const saraswathiCard = document.getElementById('saraswathi-card');

// --- State Variables ---
let isListening = false;
let recognition = null;
let activeTimeout = null;

// --- Initialize Grid UI (Cleaned: Removed Articulation text) ---
function renderGrid() {
    gridContainer.innerHTML = '';
    vowelsData.forEach(vowel => {
        const card = document.createElement('div');
        card.id = vowel.id;
        card.className = `
            card-transition bg-[#3d2314] border-2 border-[#5c3a21] rounded-2xl 
            p-4 flex flex-col items-center justify-center cursor-default
            aspect-square relative overflow-hidden
        `;
        
        card.innerHTML = `
            <span class="vowel-char mb-2">${vowel.char}</span>
            <span class="text-amber-400/80 font-mono text-sm tracking-widest">${vowel.phonetic}</span>
        `;
        
        gridContainer.appendChild(card);
    });
}

// --- Visual Effect: The Glow Sequence ---
function triggerGlow(vowelObj) {
    if (activeTimeout) clearTimeout(activeTimeout);

    document.querySelectorAll('.glow-active').forEach(el => el.classList.remove('glow-active'));

    const targetCard = document.getElementById(vowelObj.id);
    if (targetCard) targetCard.classList.add('glow-active');
    saraswathiCard.classList.add('glow-active');

    activeTimeout = setTimeout(() => {
        if (targetCard) targetCard.classList.remove('glow-active');
        saraswathiCard.classList.remove('glow-active');
    }, 1500);
}

// --- Audio Processing Engine (Web Speech API) ---
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        micStatus.textContent = "Browser not supported";
        micBtn.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN'; 
    recognition.continuous = true;
    recognition.interimResults = true; 

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('mic-listening');
        micStatus.textContent = "Listening...";
    };

    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim().toLowerCase();
            
            // Flexible matching against both Tamil and English phonetic representations
            const matchedVowel = vowelsData.find(vowel => 
                vowel.matches.some(match => transcript.includes(match))
            );
            
            if (matchedVowel) {
                triggerGlow(matchedVowel);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
        if (event.error === 'not-allowed') stopListening();
    };

    recognition.onend = () => {
        if (isListening) {
            try { recognition.start(); } catch (e) { stopListening(); }
        } else {
            stopListening();
        }
    };
}

function startListening() {
    if (!recognition) return;
    try { recognition.start(); } catch (e) {}
}

function stopListening() {
    isListening = false;
    if (recognition) recognition.stop();
    micBtn.classList.remove('mic-listening');
    micStatus.textContent = "Tap to start";
}

micBtn.addEventListener('click', () => {
    if (isListening) { stopListening(); } else { startListening(); }
});

renderGrid();
setupSpeechRecognition();
