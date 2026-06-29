// Initialize Lucide Icons
lucide.createIcons();

// --- Data Matrix: Vowels & Articulation Mapping ---
const vowelsData = [
    { id: 'v1',  char: 'அ', phonetic: 'A',  articulation: 'throat' },
    { id: 'v2',  char: 'ஆ', phonetic: 'AA', articulation: 'throat' },
    { id: 'v3',  char: 'இ', phonetic: 'I',  articulation: 'palate' },
    { id: 'v4',  char: 'ஈ', phonetic: 'II', articulation: 'palate' },
    { id: 'v5',  char: 'உ', phonetic: 'U',  articulation: 'lips' },
    { id: 'v6',  char: 'ஊ', phonetic: 'UU', articulation: 'lips' },
    { id: 'v7',  char: 'எ', phonetic: 'E',  articulation: 'mid-palate' },
    { id: 'v8',  char: 'ஏ', phonetic: 'EE', articulation: 'mid-palate' },
    { id: 'v9',  char: 'ஐ', phonetic: 'AI', articulation: 'palate-teeth' },
    { id: 'v10', char: 'ஒ', phonetic: 'O',  articulation: 'throat-lips' },
    { id: 'v11', char: 'ஓ', phonetic: 'OO', articulation: 'throat-lips' },
    { id: 'v12', char: 'ஔ', phonetic: 'AU', articulation: 'throat-lips' }
];

// --- DOM Elements ---
const gridContainer = document.getElementById('vowel-grid');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const saraswathiCard = document.getElementById('saraswathi-card');
const articulationDisplay = document.getElementById('articulation-display');

// --- State Variables ---
let isListening = false;
let recognition = null;
let activeTimeout = null;

// --- Initialize Grid UI ---
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
            <span class="text-[10px] text-amber-100/40 uppercase mt-2 hidden md:block">${vowel.articulation}</span>
        `;
        
        gridContainer.appendChild(card);
    });
}

// --- Visual Effect: The Glow Sequence ---
function triggerGlow(vowelObj) {
    // Clear previous timeouts to prevent overlapping glitches
    if (activeTimeout) clearTimeout(activeTimeout);

    // Remove existing glows
    document.querySelectorAll('.glow-active').forEach(el => el.classList.remove('glow-active'));

    // Apply glow to matched card and Goddess illustration
    const targetCard = document.getElementById(vowelObj.id);
    if (targetCard) targetCard.classList.add('glow-active');
    saraswathiCard.classList.add('glow-active');

    // Update articulation text
    articulationDisplay.textContent = vowelObj.articulation;
    articulationDisplay.classList.add('text-amber-400');

    // Hold the illumination for 1.5 seconds
    activeTimeout = setTimeout(() => {
        if (targetCard) targetCard.classList.remove('glow-active');
        saraswathiCard.classList.remove('glow-active');
        articulationDisplay.textContent = '-';
        articulationDisplay.classList.remove('text-amber-400');
    }, 1500);
}

// --- Audio Processing Engine (Web Speech API) ---
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        micStatus.textContent = "Browser not supported";
        micBtn.disabled = true;
        micBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN';
    recognition.continuous = true;
    recognition.interimResults = true; // Allows catching partials quickly

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('mic-listening');
        micStatus.textContent = "Listening...";
    };

    recognition.onresult = (event) => {
        // Look through the results of the current transcript
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim().replace(/\s/g, '');
            
            // Check if transcript contains any of our target vowels
            // Often, single phonemes might come alongside noise. We loop to find the match.
            const matchedVowel = vowelsData.find(v => transcript.includes(v.char));
            
            if (matchedVowel) {
                triggerGlow(matchedVowel);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
        stopListening();
    };

    recognition.onend = () => {
        // If it stops but we still want it to listen, auto-restart
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                stopListening();
            }
        } else {
            stopListening();
        }
    };
}

// --- Mic Button Toggles ---
function startListening() {
    if (!recognition) return;
    try {
        recognition.start();
    } catch (e) {
        console.log("Already started.");
    }
}

function stopListening() {
    isListening = false;
    if (recognition) recognition.stop();
    micBtn.classList.remove('mic-listening');
    micStatus.textContent = "Tap to start";
}

// --- Event Listeners ---
micBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// --- Bootstrapper ---
renderGrid();
setupSpeechRecognition();

/* ====================================================================
TensorFlow.js Speech Commands Fallback Architecture (For Reference)
====================================================================
To use TFJS for non-English offline phoneme spotting:
1. Train a model at https://teachablemachine.withgoogle.com/train/audio
2. Upload the files (model.json, metadata.json, weights.bin)
3. Implement the logic below:

async function initTFJSModel() {
    const URL = "path/to/your/custom/model/";
    const recognizer = speechCommands.create(
        "BROWSER_FFT", null, URL + "model.json", URL + "metadata.json"
    );
    
    await recognizer.ensureModelLoaded();
    const classLabels = recognizer.wordLabels(); 
    
    recognizer.listen(result => {
        const scores = result.scores;
        // Find highest score, match to classLabels, and trigger triggerGlow(vowelObj)
    }, {
        probabilityThreshold: 0.75
    });
}
====================================================================
*/
