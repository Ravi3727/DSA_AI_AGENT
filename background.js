chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background script:", message);
    if (message.action === "scrapedData") {
        console.log("Scraped data received:", message.data);
    }
});
