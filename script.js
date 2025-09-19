document.addEventListener('DOMContentLoaded', () => {
    const CORRECT_PIN = '1234'; // <<< GANTI PIN ANDA DI SINI

    // Elemen Login
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const pinInput = document.getElementById('pin-input');
    const pinError = document.getElementById('pin-error');
    const loginBox = document.getElementById('login-box');

    // Elemen Aplikasi Utama
    const appContainer = document.getElementById('app-container');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const modeButtons = {
        text: document.getElementById('mode-text'),
        image: document.getElementById('mode-image'),
        document: document.getElementById('mode-document'),
        audio: document.getElementById('mode-audio'),
    };

    let currentMode = 'text';

    // === LOGIKA AUTENTIKASI ===
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        pinError.textContent = '';
        loginBox.classList.remove('shake');

        if (pinInput.value === CORRECT_PIN) {
            // PIN Benar
            loginOverlay.classList.add('opacity-0', 'pointer-events-none');
            appContainer.classList.remove('hidden');
        } else {
            // PIN Salah
            loginBox.classList.add('shake');
            pinError.textContent = 'PIN salah. Coba lagi.';
            pinInput.value = '';
            setTimeout(() => loginBox.classList.remove('shake'), 400);
        }
    });

    // === LOGIKA APLIKASI CHAT (tetap sama) ===
    function setMode(mode) {
        currentMode = mode;
        for (const key in modeButtons) {
            modeButtons[key].classList.remove('active-mode');
        }
        modeButtons[mode].classList.add('active-mode');

        if (mode === 'text') {
            fileLabel.classList.add('hidden');
            promptInput.placeholder = "Ketik pesan Anda...";
        } else {
            fileLabel.classList.remove('hidden');
            let modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
            promptInput.placeholder = `Ketik prompt untuk ${modeName}... (opsional)`;
        }
    }

    Object.keys(modeButtons).forEach(key => {
        modeButtons[key].addEventListener('click', () => setMode(key));
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        const file = fileInput.files[0];

        if (currentMode === 'text' && !prompt) return;
        if (currentMode !== 'text' && !file) {
            alert('Silakan pilih file untuk mode ini.');
            return;
        }

        const userMessage = prompt || file.name;
        displayMessage(userMessage, 'user');
        
        promptInput.value = '';
        fileInput.value = '';

        const formData = new FormData();
        if (prompt) {
           formData.append('prompt', prompt);
        }

        let endpoint = '';
        let body;
        let headers = {};

        switch (currentMode) {
            case 'text':
                endpoint = '/generate-text';
                body = JSON.stringify({ message: prompt });
                headers['Content-Type'] = 'application/json';
                break;
            case 'image':
                endpoint = '/generate-from-image';
                formData.append('image', file);
                body = formData;
                break;
            case 'document':
                endpoint = '/generate-from-document';
                formData.append('document', file);
                body = formData;
                break;
            case 'audio':
                endpoint = '/generate-from-audio';
                formData.append('audio', file);
                body = formData;
                break;
        }

        const loadingBubble = displayMessage('...', 'bot', true);

        try {
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                body: body,
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.reply || data.result;
            updateMessage(loadingBubble, reply);

        } catch (error) {
            console.error('Error:', error);
            updateMessage(loadingBubble, `Maaf, terjadi kesalahan: ${error.message}`);
        }
    });

    function displayMessage(message, sender, isLoading = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');

        if (isLoading) {
            messageBubble.innerHTML = '<span class="animate-pulse">Mengetik...</span>';
        } else {
            messageBubble.textContent = message;
        }
        
        messageWrapper.appendChild(messageBubble);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageBubble;
    }

    function updateMessage(bubble, newText) {
        bubble.innerHTML = '';
        bubble.textContent = newText;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    setMode('text');
});