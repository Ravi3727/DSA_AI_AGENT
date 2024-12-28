let allData;
// Listen to all outgoing requests to `https://api2.maang.in/*`
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        // console.log('Intercepted Request:', details);
        const temp = details.url;
        if(temp.includes ('https://api2.maang.in/problems/user/')) {
            allData = {temp};
        }

        console.log('URL:', details.url);

        console.log("All data:", allData);
    },
    { urls: ["*://api2.maang.in/*"] } 
);



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "fetchHints") {
        // Define the headers
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json, text/plain, */*");
        myHeaders.append("accept-language", "en-US,en;q=0.9");
        myHeaders.append(
            "authorization",
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxOTczNywiZW1haWwiOiJyazM3MjcwMDBAZ21haWwuY29tIiwiZXhwIjoxNzM1MzczMzYxfQ.csc0U8hhbWj9VfU_HNPrygTzZz984rdUAZNk0PH1O3E"
        );
        myHeaders.append("dnt", "1");
        myHeaders.append("origin", "https://maang.in");
        myHeaders.append("priority", "u=1, i");
        myHeaders.append("referer", "https://maang.in/");
        myHeaders.append("sec-ch-ua", "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"");
        myHeaders.append("sec-ch-ua-mobile", "?1");
        myHeaders.append("sec-ch-ua-platform", "\"Android\"");
        myHeaders.append("sec-fetch-dest", "empty");
        myHeaders.append("sec-fetch-mode", "cors");
        myHeaders.append("sec-fetch-site", "same-site");
        myHeaders.append(
            "user-agent",
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
        );

        
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

       

        fetch(allData.temp, requestOptions)
            .then((response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    return response.text().then((error) => {
                        throw new Error(`Error ${response.status}: ${error}`);
                    });
                }
            })
            .then((result) => {
                console.log("Fetched hints in background.js:", result);
                sendResponse({ success: true, data: result });
            })
            .catch((error) => {
                console.error("Fetch error in background.js:", error);
                sendResponse({ success: false, error: error.message });
            });

        // Indicate async response
        return true;
    }
});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background script:", message);
    if (message.action === "scrapedData") {
        console.log("Scraped data received:", message.data);
    }
});





// Background script to handle the API fetch





// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         console.log('Intercepted request:', details);

//         // Filter specific calls if necessary
//         if (details.url.includes('https://api2.maang.in/problems/user/')) {
//             console.log('Specific call:', details.url);
//         }
//     },
//     { urls: ["https://maang.in/problems/*"] }, // Adjust to target specific URLs
//     ["blocking"]
// );



// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         if (details.url.includes('https://api2.maang.in/problems/user/')) {
//             chrome.runtime.sendMessage({ interceptedUrl: details.url });
//         }
//     },
//     { urls: ["https://maang.in/problems/*"] },
//     []
// );