document.addEventListener('DOMContentLoaded', function() {
    // Select all feature buttons
    const selectButtons = document.querySelectorAll('.select-btn');
    // Select all feature forms
    const featureForms = document.querySelectorAll('.feature-form');
    // Select the loader
    const loader = document.getElementById('loader');
    
    // Base URL for API endpoints
    const API_URL = 'http://localhost:3000';
    
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
}); 