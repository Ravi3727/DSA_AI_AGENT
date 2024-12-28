document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api_key');
    const saveButton = document.getElementById('save');

    // Check if an API key exists in storage
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey; 
        } else {
            startReminder(); 
        }
    });

    // Save the API key when the button is clicked
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.local.set({ apiKey: apiKey }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to save API key:', chrome.runtime.lastError);
                } else {
                    console.log('API key saved successfully:', apiKey);
                    alert('API Key saved successfully!');
                    window.close();
                }
            });
        } else {
            alert('Please give API key.');
            console.warn('API key is empty. Please provide a valid key.');
        }
    });

    // Function to start the reminder alert
    function startReminder() {
        const reminderInterval = setInterval(() => {
            chrome.storage.local.get(['apiKey'], (result) => {
                if (!result.apiKey) {
                    alert('Please enter your API key or Off the DSA AI Agent Ext.');
                } else {
                    clearInterval(reminderInterval); 
                }
            });
        }, 20000); // 2 minutes 
    }
});
