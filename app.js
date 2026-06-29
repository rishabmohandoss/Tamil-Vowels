lucide.createIcons();

// --- Heavily Expanded Phonetic Matrix ---
// If the Live Transcript shows a weird word when you say a letter, add it to these arrays!
const vowelsData = [
    { id: 'v1',  char: 'அ', phonetic: 'A',  matches: ['அ', 'a', 'ah', 'uh', 'up', 'are'] },
    { id: 'v2',  char: 'ஆ', phonetic: 'AA', matches: ['ஆ', 'aa', 'aah', 'ha', 'aw'] },
    { id: 'v3',  char: 'இ', phonetic: 'I',  matches: ['இ', 'i', 'ee', 'e', 'is', 'it'] },
    { id: 'v4',  char: 'ஈ', phonetic: 'II', matches: ['ஈ', 'ii', 'eee', 'yi', 'eat', 'he'] },
    { id: 'v5',  char: 'உ', phonetic: 'U',  matches: ['உ', 'u', 'oo', 'ou', 'who'] },
    { id: 'v6',  char: 'ஊ', phonetic: 'UU', matches: ['ஊ', 'uu', 'ooo', 'ooh'] },
    { id: 'v7',  char: 'எ', phonetic: 'E',  matches: ['எ', 'e', 'eh', 'yeah', 'ye'] },
    { id: 'v8',  char: 'ஏ', phonetic: 'EE', matches: ['ஏ', 'ee', 'ay', 'ae', 'hey', 'a'] },
    { id: 'v9',  char: 'ஐ', phonetic: 'AI', matches: ['ஐ', 'ai', 'i', 'eye', 'why', 'hi'] },
    { id: 'v10', char: 'ஒ', phonetic: 'O',  matches: ['ஒ', 'o', 'oh', 'or'] },
    { id: 'v11', char: 'ஓ', phonetic: 'OO', matches: ['ஓ', 'oo', 'ohh', 'owe'] },
    { id: 'v12', char: 'ஔ', phonetic: 'AU', matches: ['ஔ', 'au', 'ow', 'av', 'how', 'cow'] }
];

const gridContainer = document.getElementById('vowel-grid');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const saraswathiCard = document.getElementById('saraswathi-card');
const transcriptDebug = document.getElementById('transcript-debug'); // New Debug Box

let isListening = false;
let recognition = null;
let activeGlowTimeout = null;
let isAnimating = false; // Prevent multiple letters flying at once

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

// --- NEW: Flying Letter Animation Logic ---
function spawnFlyingLetter(vowelObj) {
    if (isAnimating) return;
    isAnimating = true;

    const targetCard = document.getElementById(vowelObj.id);
    if (!targetCard) return;

    // 1. Get Coordinates
    const startRect = saraswathiCard.getBoundingClientRect();
    const endRect = targetCard.getBoundingClientRect();

    const startX = startRect.left + (startRect.width / 2);
    const startY = startRect.top + (startRect.height / 2);
    const endX = endRect.left + (endRect.width / 2);
    const endY = endRect.top + (endRect.height / 2);

    // 2. Create the floating letter
    const floater = document.createElement('div');
    floater.textContent = vowelObj.char;
    floater.className = 'floating-letter';
    floater.style.left = `${startX}px`;
    floater.style.top = `${startY}px`;
    document.body.appendChild(floater);

    // 3. Glow the Goddess immediately
    saraswathiCard.classList.add('glow-active');

    // 4. Trigger the flight path
    requestAnimationFrame(() => {
        // Small delay ensures the browser registers the starting coordinates before moving
        setTimeout(() => {
            floater.classList.add('floating-letter-active');
            floater.style.left = `${endX}px`;
            floater.style.top = `${endY}px`;
        }, 50);
    });

    // 5. Cleanup after flight finishes (0.7s matching the CSS transition)
    setTimeout(() => {
        floater.remove();
        saraswathiCard.classList.remove('glow-active');
        
        // Glow the target card now that the letter has "arrived"
        triggerTargetGlow(targetCard);
        isAnimating = false;
    }, 750);
}

function triggerTargetGlow(targetCard) {
    if (activeGlowTimeout) clearTimeout(activeGlowTimeout);
    document.querySelectorAll('.glow-active').forEach(el => el.classList.remove('glow-active'));
    
    targetCard.classList.add('glow-active');

    activeGlowTimeout = setTimeout(() => {
        targetCard.classList.remove('glow-active');
    }, 1500);
}

// --- Audio Processing Engine ---
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
        transcriptDebug.textContent = "Waiting for audio...";
    };

    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const rawTranscript = event.results[i][0].transcript.trim();
            const lowerTranscript = rawTranscript.toLowerCase();
            
            // Update the debug box so the user can see what the API heard
            transcriptDebug.textContent = `Heard: "${rawTranscript}"`;
            
            // Look for matches
            const matchedVowel = vowelsData.find(vowel => 
                vowel.matches.some(match => lowerTranscript.includes(match))
            );
            
            if (matchedVowel && !isAnimating) {
                spawnFlyingLetter(matchedVowel);
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
    transcriptDebug.textContent = "Paused.";
}

micBtn.addEventListener('click', () => {
    if (isListening) { stopListening(); } else { startListening(); }
});

renderGrid();
setupSpeechRecognition();
