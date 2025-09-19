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
    const attachmentInfo = document.getElementById('attachment-info');
    const modeButtons = {
        text: document.getElementById('mode-text'),
        image: document.getElementById('mode-image'),
        document: document.getElementById('mode-document'),
        audio: document.getElementById('mode-audio'),
    };

    let currentMode = 'text';
    let chatHistory = [];

    // === LOGIKA AUTENTIKASI ===
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        pinError.textContent = '';
        loginBox.classList.remove('shake');

        if (pinInput.value === CORRECT_PIN) {
            loginOverlay.classList.add('opacity-0', 'pointer-events-none');
            appContainer.classList.remove('hidden');
        } else {
            loginBox.classList.add('shake');
            pinError.textContent = 'PIN salah. Coba lagi.';
            pinInput.value = '';
            setTimeout(() => loginBox.classList.remove('shake'), 400);
        }
    });

    // === LOGIKA APLIKASI CHAT ===

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            attachmentInfo.textContent = `Lampiran: ${fileName}`;
            attachmentInfo.classList.remove('hidden');
        } else {
            attachmentInfo.textContent = '';
            attachmentInfo.classList.add('hidden');
        }
    });

    function setMode(mode) {
        currentMode = mode;
        for (const key in modeButtons) {
            modeButtons[key].classList.remove('active-mode');
        }
        modeButtons[mode].classList.add('active-mode');

        if (mode === 'text') {
            fileLabel.classList.add('hidden');
            promptInput.placeholder = "Ketik pesan Anda...";
            attachmentInfo.textContent = '';
            attachmentInfo.classList.add('hidden');
            fileInput.value = '';
        } else {
            fileLabel.classList.remove('hidden');
            let modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
            promptInput.placeholder = `Ketik prompt untuk ${modeName}... (opsional)`;
        }
        if (mode !== 'text') {
            chatHistory = []; // Hapus komentar ini jika ingin chat direset saat ganti mode
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

        // --- PERUBAHAN DI SINI ---
        // Panggil displayMessage dengan menyertakan nama file
        displayMessage(prompt, 'user', { attachmentName: file ? file.name : null });
        // -------------------------
        
        promptInput.value = '';
        fileInput.value = '';
        attachmentInfo.textContent = '';
        attachmentInfo.classList.add('hidden');

        const formData = new FormData();
        if (prompt) {
           formData.append('prompt', prompt);
        }

        let endpoint = '';
        let body;
        let headers = {};

        if (currentMode === 'text') {
            // 1. Tambahkan pesan baru ke riwayat
            chatHistory.push({
                role: 'user',
                parts: [{ text: prompt }]
            });

            // 2. Siapkan body untuk dikirim ke backend
            endpoint = '/generate-text';
            body = JSON.stringify({ history: chatHistory });
            headers['Content-Type'] = 'application/json';
        } else {
            // Mode file tetap stateless (tidak menggunakan chatHistory)
            const formData = new FormData();
            if (prompt) {
                formData.append('prompt', prompt);
            }
            switch (currentMode) {
                case 'image':
                    endpoint = '/generate-from-image';
                    formData.append('image', file);
                    break;
                case 'document':
                    endpoint = '/generate-from-document';
                    formData.append('document', file);
                    break;
                case 'audio':
                    endpoint = '/generate-from-audio';
                    formData.append('audio', file);
                    break;
            }
            body = formData;
        }
        // switch (currentMode) {
        //     case 'text':
        //         endpoint = '/generate-text';
        //         body = JSON.stringify({ message: prompt });
        //         headers['Content-Type'] = 'application/json';
        //         break;
        //     case 'image':
        //         endpoint = '/generate-from-image';
        //         formData.append('image', file);
        //         body = formData;
        //         break;
        //     case 'document':
        //         endpoint = '/generate-from-document';
        //         formData.append('document', file);
        //         body = formData;
        //         break;
        //     case 'audio':
        //         endpoint = '/generate-from-audio';
        //         formData.append('audio', file);
        //         body = formData;
        //         break;
        // }

        promptInput.value = '';
        fileInput.value = '';
        attachmentInfo.textContent = '';
        attachmentInfo.classList.add('hidden');

        const loadingBubble = displayMessage('', 'bot', { isLoading: true });

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

            if (currentMode === 'text') {
                chatHistory.push({
                    role: 'model',
                    parts: [{ text: reply }]
                });
            }
            
            updateMessage(loadingBubble, reply);

        } catch (error) {
            console.error('Error:', error);
            updateMessage(loadingBubble, `Maaf, terjadi kesalahan: ${error.message}`);
        }
    });

    // --- FUNGSI displayMessage DIPERBARUI ---
    function displayMessage(message, sender, options = {}) {
        const { isLoading = false, attachmentName = null } = options;

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        // Jika ini pesan pengguna dan ada lampiran, buat gelembung lampiran
        if (sender === 'user' && attachmentName) {
            const attachmentBubble = document.createElement('div');
            attachmentBubble.classList.add('attachment-bubble');
            attachmentBubble.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>${attachmentName}</span>
            `;
            messageWrapper.appendChild(attachmentBubble);
        }

        const hasContent = message || (sender === 'bot' && isLoading);
        
        // Buat gelembung pesan utama jika ada konten (teks atau loading)
        if (hasContent) {
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble');

            if (isLoading) {
                messageBubble.innerHTML = '<span class="animate-pulse">Mengetik...</span>';
            } else {
                messageBubble.textContent = message;
            }
            
            messageWrapper.appendChild(messageBubble);
        }
        
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageWrapper.querySelector('.message-bubble'); // Kembalikan bubble untuk diupdate
    }

    function updateMessage(bubble, newText) {
        if (bubble) {
            bubble.innerHTML = '';
            bubble.textContent = newText;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    setMode('text');
});