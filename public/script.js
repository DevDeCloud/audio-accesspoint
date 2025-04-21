document.addEventListener('DOMContentLoaded', function() {
    // Select all feature buttons
    const selectButtons = document.querySelectorAll('.select-btn');
    // Select all feature forms
    const featureForms = document.querySelectorAll('.feature-form');
    // Select the loader
    const loader = document.getElementById('loader');
    
    // Base URL for API endpoints
    const API_URL = window.location.origin;
    
    // WebSocket for real-time transcription
    let socket = null;
    
    // Handle feature selection
    selectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const feature = this.dataset.feature;
            
            // Hide all forms first
            featureForms.forEach(form => {
                form.classList.remove('active');
            });
            
            // Show the selected form
            const selectedForm = document.getElementById(`${feature}-form`);
            if (selectedForm) {
                selectedForm.classList.add('active');
                
                // Scroll to the form
                selectedForm.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Automatically show the first feature form when page loads
    setTimeout(() => {
        if (featureForms.length > 0 && !document.querySelector('.feature-form.active')) {
            featureForms[0].classList.add('active');
        }
    }, 500);
    
    // Audio to Text Form Submission
    const audioToTextForm = document.getElementById('audio-to-text-form');
    if (audioToTextForm) {
        audioToTextForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const audioFileInput = document.getElementById('audio-file');
            const audioFile = audioFileInput.files[0];
            const languageCode = document.getElementById('language-code').value;
            const accountNFT = document.getElementById('account-nft-transcription').value;
            
            if (!audioFile) {
                alert('Please select an audio file to transcribe');
                return;
            }
            
            console.log("Selected file:", audioFile.name, "Size:", audioFile.size);
            
            if (!accountNFT) {
                alert('Please enter your Account NFT');
                return;
            }
            
            // Show loader
            loader.classList.add('active');
            
            // Create form data
            const formData = new FormData();
            formData.append('files', audioFile, audioFile.name); // Explicitly set filename
            formData.append('prompt', `Transcribe this audio file to text. Language: ${languageCode}`);
            formData.append('accountNFT', accountNFT);
            
            try {
                console.log("Sending request to:", `${API_URL}/run-function`);
                
                const response = await fetch(`${API_URL}/run-function`, {
                    method: 'POST',
                    body: formData
                });
                
                console.log("Response status:", response.status);
                const data = await response.json();
                console.log("Response data:", data);
                
                // Hide loader
                loader.classList.remove('active');
                
                // Display result
                const resultContainer = document.getElementById('transcription-result');
                const resultContent = resultContainer.querySelector('.result-content');
                const downloadBtn = document.getElementById('download-transcription');
                
                if (data.success) {
                    resultContainer.classList.add('active');
                    resultContent.textContent = data.transcription;
                    
                    // Enable download button
                    downloadBtn.style.display = 'block';
                    downloadBtn.addEventListener('click', function() {
                        // Create download link
                        const blob = new Blob([data.transcription], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'transcription.txt';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    });
                } else {
                    alert(`Error: ${data.error || 'Failed to transcribe audio'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while transcribing the audio');
                loader.classList.remove('active');
            }
        });
    }
    
    // Text to Speech Form Submission
    const textToSpeechForm = document.getElementById('text-to-speech-form');
    if (textToSpeechForm) {
        textToSpeechForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const text = document.getElementById('tts-text').value;
            const voice = document.getElementById('voice-selection').value;
            const accountNFT = document.getElementById('account-nft-tts').value;
            
            if (!text) {
                alert('Please enter text to convert to speech');
                return;
            }
            
            if (!accountNFT) {
                alert('Please enter your Account NFT');
                return;
            }
            
            // Show loader
            loader.classList.add('active');
            
            try {
                // Create FormData to match the API's expected format
                const formData = new FormData();
                formData.append('prompt', `Convert this text to speech: "${text}" using voice ${voice}`);
                formData.append('accountNFT', accountNFT);
                
                const response = await fetch(`${API_URL}/run-function`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                // Hide loader
                loader.classList.remove('active');
                
                // Display result
                const resultContainer = document.getElementById('tts-result');
                const audioPlayer = document.getElementById('audio-player');
                const downloadBtn = document.getElementById('download-speech');
                
                if (data.success) {
                    resultContainer.classList.add('active');
                    
                    // Set audio source and play
                    const audioUrl = `${API_URL}/temp/${data.speechFilePath.split('/').pop()}`;
                    audioPlayer.src = audioUrl;
                    audioPlayer.style.display = 'block';
                    
                    // Enable download button
                    downloadBtn.style.display = 'block';
                    downloadBtn.addEventListener('click', function() {
                        // Create download link
                        const a = document.createElement('a');
                        a.href = audioUrl;
                        a.download = 'speech.mp3';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                } else {
                    alert(`Error: ${data.error || 'Failed to convert text to speech'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while converting text to speech');
                loader.classList.remove('active');
            }
        });
    }
    
    // Real-time Speech to Text
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const clearTranscriptionBtn = document.getElementById('clear-transcription');
    const liveTranscriptionDiv = document.getElementById('live-transcription');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const downloadLiveTranscriptionBtn = document.getElementById('download-live-transcription');
    const copyTranscriptionBtn = document.getElementById('copy-transcription');
    const realtimeLanguageSelect = document.getElementById('realtime-language-code');
    
    if (startRecordingBtn && stopRecordingBtn) {
        let mediaRecorder;
        let audioContext;
        let audioStream;
        let audioChunks = [];
        let finalTranscript = '';
        let isRecording = false;
        
        // Check if browser supports required features
        if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            startRecordingBtn.disabled = true;
            stopRecordingBtn.disabled = true;
            liveTranscriptionDiv.innerHTML = '<p class="error">Your browser does not support the required features for real-time transcription. Please use a modern browser like Chrome, Firefox, or Edge.</p>';
        } else {
            // Helper function to create notification elements
            const createNotification = (message, isError = false) => {
                const notificationEl = document.createElement('div');
                notificationEl.className = isError ? 'notification error' : 'notification';
                notificationEl.textContent = message;
                liveTranscriptionDiv.appendChild(notificationEl);
                liveTranscriptionDiv.scrollTop = liveTranscriptionDiv.scrollHeight;
                
                // Auto-remove notification after 5 seconds unless it's an error
                if (!isError) {
                    setTimeout(() => {
                        if (notificationEl.parentNode === liveTranscriptionDiv) {
                            liveTranscriptionDiv.removeChild(notificationEl);
                        }
                    }, 5000);
                }
            };
            
            startRecordingBtn.addEventListener('click', async function() {
                try {
                    // Clear previous transcription
                    liveTranscriptionDiv.innerHTML = '';
                    finalTranscript = '';
                    downloadLiveTranscriptionBtn.style.display = 'none';
                    copyTranscriptionBtn.style.display = 'none';
                    
                    // Request microphone access
                    audioStream = await navigator.mediaDevices.getUserMedia({ 
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                            sampleRate: 16000
                        } 
                    });
                    
                    // Create audio context to get proper format
                    audioContext = new (window.AudioContext || window.webkitAudioContext)({
                        sampleRate: 16000
                    });
                    
                    // Update UI to show recording state
                    startRecordingBtn.disabled = true;
                    stopRecordingBtn.disabled = false;
                    clearTranscriptionBtn.disabled = true;
                    statusIndicator.classList.add('recording');
                    statusText.textContent = 'Recording...';
                    isRecording = true;
                    
                    // Initialize WebSocket connection if not already connected
                    if (!socket || socket.readyState !== WebSocket.OPEN) {
                        // Create WebSocket connection
                        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        socket = new WebSocket(`${wsProtocol}//${window.location.host}`);
                        
                        socket.onopen = function() {
                            console.log('WebSocket connection established');
                            
                            // Send language setting
                            socket.send(JSON.stringify({
                                command: 'language',
                                language: realtimeLanguageSelect.value
                            }));
                            
                            // Send start command
                            socket.send(JSON.stringify({ command: 'start' }));
                        };
                        
                        socket.onmessage = function(event) {
                            const data = JSON.parse(event.data);
                            
                            if (data.error) {
                                console.error('Error from server:', data.error);
                                // Only show non-timeout errors to the user
                                if (!data.error.includes('Timeout') && 
                                    !data.error.includes('Audio Timeout') &&
                                    !data.error.includes('duration elapsed')) {
                                    createNotification(`Error: ${data.error}`, true);
                                }
                            } else if (data.notification) {
                                console.log('Notification from server:', data.notification);
                                // Don't show timeout-related notifications to the user
                                if (!data.notification.includes('restart') && 
                                    !data.notification.includes('timeout') && 
                                    !data.notification.includes('Timeout')) {
                                    createNotification(data.notification);
                                }
                            } else if (data.status) {
                                console.log('Status update:', data.status, data.message);
                                
                                // Update UI based on status
                                if (data.status === 'ready') {
                                    // Subtle visual indication that we're ready again
                                    statusIndicator.classList.remove('reconnecting');
                                    statusIndicator.classList.add('recording');
                                    // Quietly update status text
                                    statusText.textContent = 'Recording...';
                                } else if (data.status === 'reconnecting') {
                                    // Show reconnecting state (but don't interrupt the user)
                                    statusIndicator.classList.remove('recording');
                                    statusIndicator.classList.add('reconnecting');
                                    // Update status text without showing an error
                                    statusText.textContent = 'Reconnecting...';
                                }
                            } else if (data.transcript) {
                                // Update the transcription display
                                if (data.isFinal) {
                                    finalTranscript += data.transcript + ' ';
                                    
                                    // Add final transcription to display
                                    const finalPara = document.createElement('p');
                                    finalPara.className = 'final';
                                    finalPara.textContent = data.transcript;
                                    
                                    // Remove any interim text
                                    const interimElem = document.querySelector('.interim');
                                    if (interimElem) {
                                        liveTranscriptionDiv.removeChild(interimElem);
                                    }
                                    
                                    liveTranscriptionDiv.appendChild(finalPara);
                                    liveTranscriptionDiv.scrollTop = liveTranscriptionDiv.scrollHeight;
                                    
                                    // Reset status if we were reconnecting (success signal)
                                    if (statusIndicator.classList.contains('reconnecting')) {
                                        statusIndicator.classList.remove('reconnecting');
                                        statusIndicator.classList.add('recording');
                                        statusText.textContent = 'Recording...';
                                    }
                                    
                                    // Enable download and copy buttons
                                    downloadLiveTranscriptionBtn.style.display = 'flex';
                                    copyTranscriptionBtn.style.display = 'flex';
                                } else {
                                    // Update interim result
                                    let interimElem = document.querySelector('.interim');
                                    
                                    if (!interimElem) {
                                        interimElem = document.createElement('p');
                                        interimElem.className = 'interim';
                                        liveTranscriptionDiv.appendChild(interimElem);
                                    }
                                    
                                    interimElem.textContent = data.transcript;
                                    liveTranscriptionDiv.scrollTop = liveTranscriptionDiv.scrollHeight;
                                }
                            }
                        };
                        
                        socket.onerror = function(error) {
                            console.error('WebSocket error:', error);
                            createNotification('WebSocket connection error', true);
                        };
                        
                        socket.onclose = function() {
                            console.log('WebSocket connection closed');
                            if (isRecording) {
                                createNotification('Connection to server lost. Please try again.', true);
                                stopRecording();
                            }
                        };
                    }
                    
                    // Function to process and send audio data
                    const processAudio = () => {
                        const source = audioContext.createMediaStreamSource(audioStream);
                        const processor = audioContext.createScriptProcessor(4096, 1, 1);
                        
                        source.connect(processor);
                        processor.connect(audioContext.destination);
                        
                        processor.onaudioprocess = function(e) {
                            if (!isRecording) return;
                            
                            // Get audio data
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Convert float32 to int16
                            const int16Data = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                            }
                            
                            // Send data to server if connection is open
                            if (socket && socket.readyState === WebSocket.OPEN) {
                                socket.send(int16Data.buffer);
                            }
                        };
                        
                        return processor; // Return the processor to keep reference
                    };
                    
                    // Start audio processing
                    const audioProcessor = processAudio();
                    
                    // Store the processor reference
                    mediaRecorder = { 
                        stream: audioStream,
                        audioProcessor: audioProcessor,
                        stop: function() {
                            isRecording = false;
                            if (audioContext) {
                                // Disconnect the audio processor
                                this.audioProcessor.disconnect();
                                audioContext.close();
                            }
                            // Stop all audio tracks
                            this.stream.getTracks().forEach(track => track.stop());
                        }
                    };
                    
                } catch (error) {
                    console.error('Error starting recording:', error);
                    alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
                    
                    // Reset UI
                    startRecordingBtn.disabled = false;
                    stopRecordingBtn.disabled = true;
                    clearTranscriptionBtn.disabled = false;
                    statusIndicator.classList.remove('recording');
                    statusText.textContent = 'Ready to record';
                    isRecording = false;
                }
            });
            
            // Function to stop recording
            const stopRecording = function() {
                if (mediaRecorder) {
                    mediaRecorder.stop();
                    
                    // Reset UI
                    startRecordingBtn.disabled = false;
                    stopRecordingBtn.disabled = true;
                    clearTranscriptionBtn.disabled = false;
                    statusIndicator.classList.remove('recording');
                    statusText.textContent = 'Recording stopped';
                    isRecording = false;
                    
                    // Send stop command to WebSocket
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ command: 'stop' }));
                    }
                }
            };
            
            stopRecordingBtn.addEventListener('click', stopRecording);
            
            // Clear transcription
            clearTranscriptionBtn.addEventListener('click', function() {
                liveTranscriptionDiv.innerHTML = '<p class="placeholder">Your transcription will appear here as you speak...</p>';
                finalTranscript = '';
                downloadLiveTranscriptionBtn.style.display = 'none';
                copyTranscriptionBtn.style.display = 'none';
            });
            
            downloadLiveTranscriptionBtn.addEventListener('click', function() {
                if (finalTranscript) {
                    // Create download link
                    const blob = new Blob([finalTranscript], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `transcription-${new Date().toISOString().slice(0, 10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            });
            
            // Copy transcription to clipboard
            copyTranscriptionBtn.addEventListener('click', function() {
                if (finalTranscript) {
                    navigator.clipboard.writeText(finalTranscript).then(() => {
                        const originalText = copyTranscriptionBtn.innerHTML;
                        copyTranscriptionBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyTranscriptionBtn.innerHTML = originalText;
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        alert('Failed to copy text to clipboard');
                    });
                }
            });
            
            // Update language when selection changes
            realtimeLanguageSelect.addEventListener('change', function() {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        command: 'language',
                        language: realtimeLanguageSelect.value
                    }));
                }
            });
        }
    }
    
    // Real-time Text to Speech
    const speakBtn = document.getElementById('speak-text');
    const clearTtsTextBtn = document.getElementById('clear-tts-text');
    const clearHistoryBtn = document.getElementById('clear-history');
    const realtimeTtsText = document.getElementById('realtime-tts-text');
    const realtimeVoiceSelect = document.getElementById('realtime-voice-selection');
    const realtimeAudioPlayer = document.getElementById('realtime-audio-player');
    const speechHistory = document.getElementById('speech-history');
    
    if (speakBtn && realtimeTtsText && realtimeAudioPlayer) {
        let speechItems = [];
        
        speakBtn.addEventListener('click', async function() {
            const text = realtimeTtsText.value.trim();
            const voice = realtimeVoiceSelect.value;
            
            if (!text) {
                alert('Please enter text to speak');
                return;
            }
            
            // Show loader
            loader.classList.add('active');
            
            try {
                // Send request to the real-time TTS endpoint
                const response = await fetch(`${API_URL}/tts-stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text, voice })
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                
                // Get audio data
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Hide loader
                loader.classList.remove('active');
                
                // Set audio source and play
                realtimeAudioPlayer.src = audioUrl;
                realtimeAudioPlayer.play();
                
                // Add to speech history
                const speechItem = {
                    id: Date.now(),
                    text,
                    voice,
                    url: audioUrl
                };
                
                speechItems.unshift(speechItem); // Add to beginning of array
                if (speechItems.length > 10) {
                    // Limit history to 10 items
                    URL.revokeObjectURL(speechItems.pop().url); // Clean up old audio URLs
                }
                
                updateSpeechHistory();
                
                // Clear input field if successfully spoken
                if (clearTtsAfterSpeak) {
                    realtimeTtsText.value = '';
                }
                
            } catch (error) {
                console.error('Error in real-time TTS:', error);
                alert('An error occurred while generating speech');
                loader.classList.remove('active');
            }
        });
        
        // Clear text button
        clearTtsTextBtn.addEventListener('click', function() {
            realtimeTtsText.value = '';
            realtimeTtsText.focus();
        });
        
        // Clear history button
        clearHistoryBtn.addEventListener('click', function() {
            // Clean up URLs
            speechItems.forEach(item => {
                URL.revokeObjectURL(item.url);
            });
            
            // Clear array
            speechItems = [];
            updateSpeechHistory();
        });
        
        // Option to auto-clear text after speaking (default: false)
        let clearTtsAfterSpeak = false;
        
        // Function to update speech history display
        function updateSpeechHistory() {
            speechHistory.innerHTML = '';
            
            if (speechItems.length === 0) {
                speechHistory.innerHTML = '<p class="placeholder">No speech history yet</p>';
                return;
            }
            
            speechItems.forEach(item => {
                const speechItemElement = document.createElement('div');
                speechItemElement.className = 'speech-item';
                
                const text = document.createElement('p');
                text.textContent = item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text;
                
                const playBtn = document.createElement('button');
                playBtn.innerHTML = '<i class="fas fa-play-circle"></i>';
                playBtn.title = 'Play';
                
                playBtn.addEventListener('click', function() {
                    realtimeAudioPlayer.src = item.url;
                    realtimeAudioPlayer.play();
                });
                
                speechItemElement.appendChild(text);
                speechItemElement.appendChild(playBtn);
                
                speechHistory.appendChild(speechItemElement);
            });
        }
        
        // Initialize the speech history
        updateSpeechHistory();
    }
}); 