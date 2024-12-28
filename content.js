const CHAT_TOGGLE_BUTTON_ID = "chat-toggle-button";
const CHAT_BOX_ID = "chat-box";
const roborIcon = chrome.runtime.getURL("assets/largerobo.png");
const sendIcon = chrome.runtime.getURL("assets/send.png");
const deleteIcon = chrome.runtime.getURL("assets/delete.png");
let GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
// ------------------   Global Variables (Not a best practise)  ---------------------
let uniqueKey, uniqueIdOfpage, userCode, apiKey = null, theme, Context;






// -------------- Function to fetch API key from chrome storage -----------------
async function callAPI() {
    chrome.runtime.sendMessage({ type: "fetchAPI" }, (response) => {
        if (response.success) {
            console.log("API Data:", response.data);
        } else {
            console.error("API Fetch Error:", response.error);
        }
    });
}

// Example: Trigger the API call
callAPI();








// ----- Function to interact with Network Tab--------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.interceptedUrl) {
        console.log('Intercepted URL in content script:', message.interceptedUrl);
    }
});






// --------------- Funtion to fetche API key from chrome storage -----------------

function fetchApiKey() {
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKey = result.apiKey;
            // console.log('Fetched API Key:', apiKey);
            GEMINI_API_URL += apiKey;
            // console.log("API URL:", GEMINI_API_URL);
            clearInterval(apiKeyInterval);
        } else {
            console.log('API Key not found. Retrying...');
        }
    });
}

// Set an interval to retry fetching the API key every 3 seconds
const apiKeyInterval = setInterval(fetchApiKey, 3000);



// ------------------ Function to delete specific data from chrome sync storage -----------------

function deleteKeyFromSyncStorage(key) {
    chrome.storage.sync.remove(key, () => {
        if (chrome.runtime.lastError) {
            console.error(`Error deleting key "${key}" from sync storage:`, chrome.runtime.lastError);
        } else {
            console.log(`Key "${key}" deleted successfully from sync storage.`);
        }
    });
}

// ------------------ Function to clear all data stored by extension in sync storage -----------------


function clearSyncStorage() {
    chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
            console.error("Error clearing sync storage:", chrome.runtime.lastError);
        } else {
            console.log("Sync storage cleared successfully.");
        }
    });
}

// clearSyncStorage();





// Funtion to fetch user code from local storage using extracted number from URL

function checkAndSaveUserCode(extractedNumber) {
    const keys = Object.keys(localStorage); 
    let user_code = null;  
    
    for (let key of keys) {
        const parts = key.split('_');  
        if (parts.includes(extractedNumber.toString())) {
            user_code = localStorage.getItem(key);  
            break; 
        }
    }
    
    return user_code; 
}






// ------------------ Function to fetch user code from local storage -----------------

function fetchUserCode() {
// Example usage:
    const url = window.location.href;  
    // console.log("URL is here", url);
    const match = url.match(/https:\/\/maang\.in\/problems\/[^?]+-\d+\?/);
    const initilialUrl = match ? match[0] : null;
    const urlParts = initilialUrl.split('-'); 
    const extractedNumber = urlParts[urlParts.length - 1].split('?')[0];
    // console.log("Extracted number is here", extractedNumber);
    const user_code = checkAndSaveUserCode(extractedNumber);

    // console.log(user_code);
    userCode = user_code;  
}





// ------- Function to fetch hints from  Network tab  (After certain request give "Unauthorized" as response ------


// function FetchHints() {
//     chrome.runtime.sendMessage({ type: "fetchHints" }, (response) => {
//         if (response.success) {
//             console.log("Ye rahe hints:", response);
//         } else {
//             console.error("Error:", response.error);
//         }
//     });
// }
// FetchHints();






// ------------------ Function to get the current theme -----------------
function getTheme() {
    const chatButton = document.getElementById(CHAT_TOGGLE_BUTTON_ID);
    if (chatButton) {
        if (theme === "light") {
            chatButton.style.background = "linear-gradient(90deg, #033042, #005c83)";
        } else {
            chatButton.style.background = "#1f2836";
        }
    }

    // Update the input field color based on the theme
    const inputField = document.getElementById("ai-message-input");
    if (inputField) {
        if (theme === "light") {
            inputField.style.background = "linear-gradient(90deg, #033042, #005c83)";
        } else {
            inputField.style.background = "#1f2836";
        }
    }

    //update sent button color based on the theme
    const sendButton = document.getElementById("Ai-send-button");
    if (sendButton) {
        if (theme === "light") {
            sendButton.style.background = "linear-gradient(90deg, #033042, #005c83)";
        } else {
            sendButton.style.background = "#1f2836";
        }
    }

    // Update user and AI chats based on the theme

    const userchats = document.querySelectorAll("#user_chats");
    const AIchats = document.querySelectorAll("#ai_chats");
    if (userchats) {
        userchats.forEach(chat => {
            if (theme === "light") {
                chat.style.backgroundColor =  "#005c83";
            } else {
                chat.style.backgroundColor = "#364156";
            }
        });
    }

    if (AIchats) {
        AIchats.forEach(chat => {
            if (theme === "light") {
                chat.style.backgroundColor =  "#033042";
            } else {
                chat.style.backgroundColor = "#1f2836";
            }
        });
    }
}





// ------------------ Function to monitor changes in DOM-----------------

const observer = new MutationObserver(() => {

    // ------------------ Initialise theme variable with current website theme -----------------
    // FetchHints();



    theme = document.querySelector('html').getAttribute('data-theme');
    if(!theme){
        theme = "light";
    }
    handleRouteChange();
    getTheme();
    uniqueKey = generateUniqueKey();
    fetchUserCode();
    // FetchHints();
});

observer.observe(document.body, { childList: true, subtree: true });






// General observer for other functions
// const generalObserver = new MutationObserver(() => {
//     handleRouteChange();
//     getTheme();
//     fetchUserCode();
//     uniqueKey = generateUniqueKey();
//     console.log("General DOM changes observed.");
// });

// // Start observing the entire body for general functionality
// generalObserver.observe(document.body, { childList: true, subtree: true });

// // Variables for messagesContainer observation
// let messagesObserver = null;
// let isMessagesObserving = false;

// // Function to start observing messagesContainer
// function startMessagesContainerObserving() {
//     const messagesContainer = document.getElementById("messages-container");

//     if (messagesContainer && !isMessagesObserving) {
//         messagesObserver = new MutationObserver(() => {
//             console.log("Observed changes in messages-container.");
//             getChatFromLocalStorage((messages) => displayChatMessages(messages, messagesContainer));
//         });

//         messagesObserver.observe(messagesContainer, { childList: true, subtree: true });
//         isMessagesObserving = true;
//         console.log("Started observing messages-container.");
//     }
// }

// // Function to stop observing messagesContainer
// function stopMessagesContainerObserving() {
//     if (messagesObserver && isMessagesObserving) {
//         messagesObserver.disconnect();
//         isMessagesObserving = false;
//         console.log("Stopped observing messages-container.");
//     }
// }

// // Monitor the presence of messagesContainer dynamically
// function monitorMessagesContainerPresence() {
//     const checkInterval = setInterval(() => {
//         const messagesContainer = document.getElementById("messages-container");

//         if (messagesContainer) {
//             startMessagesContainerObserving(); // Start observing when present
//             clearInterval(checkInterval); // Stop checking further
//         } else {
//             stopMessagesContainerObserving(); // Stop observing when not present
//         }
//     }, 500);
// }

// // Call monitor function to dynamically handle messages-container
// monitorMessagesContainerPresence();





// ----------- Function to generate uniqueId for each problem to store its chats with AI seperatly ---------------
function generateUniqueKey() {

    const url = window.location.href;
    const urlObj = new URL(url);

    const path = urlObj.pathname;
    const queryParams = urlObj.searchParams.toString();

    const uniqueID = `${path.replace(/\//g, "-")}_${queryParams.replace(/=/g, "-").replace(/&/g, "_")}`;

    return uniqueID;
}






// ---------------------- Function to save chat messages to Sync storage   ----------------------

function saveChatToSyncStorage(chatMessages, uniqueKey) {
    // Save data to Chrome Sync Storage
    uniqueKey = generateUniqueKey();
    console.log("Unique key is here", uniqueKey);
    chrome.storage.sync.set({ [uniqueKey]: chatMessages }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving chat to sync storage:", chrome.runtime.lastError);
        } else {
            console.log("Chat messages saved successfully to sync storage for key:", uniqueKey);
        }
    });
}






//---------------------- Function to get chat messages from sync storage   ----------------------

function getChatFromSyncStorage(callback) {
    uniqueKey = generateUniqueKey();
    chrome.storage.sync.get([uniqueKey], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error fetching chat from local storage:", chrome.runtime.lastError);
        } else {
            // console.log("Fetched chat messages:", result[uniqueKey]);
            callback(result[uniqueKey] || []);
        }
    });
}







// ---------------------- Function to display chat messages  ----------------------
function displayChatMessages(messages, messagesContainer) {
    messagesContainer.innerHTML = "";
    const newMessages = [];
    messages.forEach((msg) => {
        const userMessageElement = document.createElement("div");
        userMessageElement.textContent = msg.text;
        userMessageElement.style.margin = "5px 0";
        userMessageElement.style.padding = "10px";
        userMessageElement.style.color = "#fff";
        userMessageElement.style.borderRadius = "5px";
        userMessageElement.style.backgroundColor = msg.sender === "user" ? "#364156" : "#1f2836";
        messagesContainer.appendChild(userMessageElement);
        

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        newMessages.push(msg);
    });
    Context = JSON.stringify(newMessages);
}





// ---------------------- Function to handle route change   ------------------------
function handleRouteChange() {
    const currentPath = window.location.pathname;
    const isOnProblemsPage = currentPath.startsWith("/problems/") && currentPath.length > "/problems/".length;

    if (isOnProblemsPage) {
        fetchUserCode();
        addChatButton();
        createChatBox();
        // FetchHints();
        // injectScript('inject.js');
    } else {
        removeChatComponents();
    }
}






// ---------------------- Function to add chat button   ------------------------
function addChatButton() {
    if (document.getElementById(CHAT_TOGGLE_BUTTON_ID)) return;

    const chatButtonPosition = document.querySelector(".coding_footer__0HiAX");
    if (!chatButtonPosition) return;
    const chatButton = document.createElement("button");
    chatButton.id = CHAT_TOGGLE_BUTTON_ID;
    chatButton.style.padding = "10px";
    // chatButton.style.backgroundColor = "#1f2836";
    chatButton.style.color = "#fff";
    chatButton.style.border = "none";
    chatButton.style.borderRadius = "5px";
    chatButton.style.cursor = "pointer";
    chatButton.style.zIndex = "50";
    chatButton.style.display = "flex";
    chatButton.style.alignItems = "center";
    chatButton.style.gap = "7px";
    chatButton.style.marginRight = "5px";
    chatButton.style.width = "120px";

    // Create the image element
    const buttonImg = document.createElement("img");
    buttonImg.id = "robo_icon_chat_button";
    buttonImg.src = roborIcon;
    buttonImg.style.height = "30px";
    buttonImg.style.width = "30px";
    buttonImg.style.flexShrink = "0";

    // Create the text node
    const buttonText = document.createElement("span");
    buttonText.textContent = "Ask Me";
    buttonText.style.fontFamily = "Arial, sans-serif";
    buttonText.style.fontWeight = "semibold";
    buttonText.style.width = "80px";

    // Append the image and text to the button
    chatButton.appendChild(buttonImg);
    chatButton.appendChild(buttonText);

    // Wrap the button and append it to the footer
    const buttonWrapper = document.createElement("div");
    buttonWrapper.style.marginRight = "auto";
    buttonWrapper.className = "d-flex align-items-center";
    buttonWrapper.appendChild(chatButton);
    chatButtonPosition.appendChild(buttonWrapper);

    chatButton.addEventListener("click", toggleChatBox);
}





// ---------------------- Function to create chat box   ------------------------
function createChatBox() {
    if (document.getElementById(CHAT_BOX_ID)) return;
    // console.log("Creating chat box...");
    const chatBox = document.createElement("div");
    chatBox.id = CHAT_BOX_ID;
    chatBox.style.position = "fixed";
    chatBox.style.bottom = "90px";
    chatBox.style.right = "20px"; 
    chatBox.style.width = "400px"; 
    chatBox.style.height = "76%"; 
    chatBox.style.backgroundColor = "transparent";
    chatBox.style.display = "none";
    chatBox.style.flexDirection = "column";
    chatBox.style.zIndex = "50";
    chatBox.style.overflowY = "auto";
    chatBox.style.borderRadius = "10px";

    // Create a <style> tag for responsive media queries
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
    @media (max-width: 768px) { /* Small and medium devices */
        #${CHAT_BOX_ID} {
        right: 10px; /* Adjust for smaller screens */
        width: 250px; /* Adjust for smaller screens */
        height: 60%; /* Adjust for smaller screens */
        }
    }
    `;

    // Append the <style> tag to the document head
    document.head.appendChild(styleTag);

    const messagesContainer = document.createElement("div");
    messagesContainer.id = "messages-container";
    messagesContainer.style.flex = "1";
    messagesContainer.style.overflowY = "auto";
    messagesContainer.style.padding = "10px";
    messagesContainer.style.color = "#fff";
    chatBox.appendChild(messagesContainer);
    const scrollbarStyles = document.createElement("style");
    scrollbarStyles.textContent = `
        #messages-container::-webkit-scrollbar {
            display: none; /* Hide the scrollbar */
        }
    
        #messages-container {
            overflow: scroll; /* Allow scrolling without showing scrollbar */
        }
    `;
    document.head.appendChild(scrollbarStyles);

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.borderTop = "1px solid #ccc";

    // Create a <style> tag for responsive media queries
    const styleTag1 = document.createElement("style");
    styleTag.innerHTML = `
    @media (max-width: 768px) { /* Small and medium devices */
        #${inputContainer.id} {
        margin-bottom: 40px; /* Adjusted margin for small/medium devices */
        }
    }
    `;

    // Append the <style> tag to the document head
    document.head.appendChild(styleTag1)


    // Create the message input textarea element
    const messageInput = document.createElement("textarea");
    messageInput.id = "ai-message-input";
    messageInput.style.color = "#fff";
    messageInput.placeholder = "Type your message...";
    messageInput.style.flex = "1";
    messageInput.style.padding = "6px"; 
    messageInput.style.border = "none";
    messageInput.style.outline = "none";
    messageInput.style.borderBottomLeftRadius = "10px";

    // Adjust width and height for larger screens (default values)
    messageInput.style.width = "100%"; 
    messageInput.style.height = "100px";
    messageInput.style.resize = "none"; 
    messageInput.style.overflowY = "auto";

    const inputScrollBar = document.createElement("style");
    inputScrollBar.textContent = `
        #ai-message-input::-webkit-scrollbar {
            display: none; /* Hide the scrollbar */
        }
    
        #ai-message-input {
            overflow: scroll; /* Allow scrolling without showing scrollbar */
        }
    `;
    document.head.appendChild(inputScrollBar);


    // Create a <style> tag for responsive media queries
    const styleTag2 = document.createElement("style");
    styleTag.innerHTML = `
    @media (max-width: 768px) { /* Small and medium devices */
        #${messageInput.id} {
        width: 250px; /* Adjust width for small/medium devices */
        height: 50px; /* Adjust height for small/medium devices */
        padding: 6px; /* Adjust padding */
        }
    }
    `;

    // Append the <style> tag to the document head
    document.head.appendChild(styleTag2);

    // Optional styling for consistent appearance
    messageInput.style.fontFamily = "Arial, sans-serif";
    messageInput.style.fontSize = "14px";
    messageInput.style.lineHeight = "1.5";


    const sendButton = document.createElement("button");
    sendButton.id = "Ai-send-button";
    // sendButton.textContent = "Send";
    // sendButton.style.padding = "10px 20px";
    // sendButton.style.color = "#fff";
    sendButton.style.border = "none";
    sendButton.style.cursor = "pointer";
    // sendButton.style.backgroundColor = "#2196f3";


    const sendButtonImg = document.createElement("img");
    sendButtonImg.id = "send_button_icon";
    sendButtonImg.src = sendIcon;
    sendButtonImg.style.height = "40px";
    sendButtonImg.style.width = "40px";
    sendButtonImg.style.flexShrink = "0";
    sendButtonImg.style.borderRadius = "10px";
    sendButton.appendChild(sendButtonImg);


    const deleteChatHistory = document.createElement("button");
    deleteChatHistory.id = "delete-chat-history";
    // deleteChatHistory.textContent = "Clear Chat";
    // deleteChatHistory.style.padding = "10px 20px";
    // deleteChatHistory.style.backgroundColor = "#e63946";
    // deleteChatHistory.style.color = "#fff";
    deleteChatHistory.style.border = "none";
    deleteChatHistory.style.cursor = "pointer";

    const deleteChatHistoryImg = document.createElement("img");
    deleteChatHistoryImg.id = "delete_button_icon";
    deleteChatHistoryImg.src = deleteIcon;
    deleteChatHistoryImg.style.height = "40px";
    deleteChatHistoryImg.style.width = "40px";
    deleteChatHistoryImg.style.flexShrink = "0";
    deleteChatHistory.style.borderEndEndRadius = "10px";
    deleteChatHistory.style.backgroundColor = "#e63946";
    // Add hover effect
    deleteChatHistory.addEventListener("mouseenter", () => {
        deleteChatHistory.style.backgroundColor = "#ef233c"; 
    });

    deleteChatHistory.addEventListener("mouseleave", () => {
        deleteChatHistory.style.backgroundColor = "#e63946";
    });

    deleteChatHistory.appendChild(deleteChatHistoryImg);

    inputContainer.appendChild(messageInput);
    inputContainer.appendChild(sendButton);
    inputContainer.appendChild(deleteChatHistory);
    chatBox.appendChild(inputContainer);

    document.body.appendChild(chatBox);

    sendButton.addEventListener("click", () => sendMessage(messageInput, messagesContainer));
    deleteChatHistory.addEventListener("click", () => deleteKeyFromSyncStorage(uniqueKey));
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") sendButton.click();
    });
}





// ---------------------- Function to remove chat components   ------------------
function removeChatComponents() {
    const chatButton = document.getElementById(CHAT_TOGGLE_BUTTON_ID);
    if (chatButton) chatButton.remove();

    const chatBox = document.getElementById(CHAT_BOX_ID);
    if (chatBox) chatBox.remove();
}






// ---------------------- Function to toggle chatBox   ------------------------
function toggleChatBox() {
    const chatBox = document.getElementById(CHAT_BOX_ID);
    const messagesContainer = document.getElementById("messages-container");
    if (chatBox || uniqueIdOfpage !== uniqueKey) {
        if (chatBox.style.display === "none") {
            chatBox.style.display = "flex";
            uniqueIdOfpage = uniqueKey;
        

            getChatFromSyncStorage((messages) => displayChatMessages(messages, messagesContainer));
            
        } else {
            chatBox.style.display = "none";
        }
    }
}





// ---------------------- Function to scrape problem data from the current page   ------------------------





if (document.readyState === 'complete') {
    // console.log("Document is already fully loaded. Starting data scraping...");
    const data = scrapeProblemData();
    chrome.runtime.sendMessage({ action: "scrapedData", data });
    // console.log("Data scraping completed and sent to extension.");
} else {
    window.addEventListener('load', () => {
        // console.log("Page fully loaded. Starting data scraping...");
        const data = scrapeProblemData();
        chrome.runtime.sendMessage({ action: "scrapedData", data });
        // console.log("Data scraping completed and sent to extension.");
    });
}





function scrapeProblemData() {
    // console.log("Scraping data...");
    let problemData = {
        problemName: "Unknown Problem",
        "Description of the problem": "",
        "Input format": "",
        "Output format": "",
        Constraints: "",
        TestCases: []
    };

    try {


        // Problem Name
        const problemNameElement = document.querySelector('.problem_heading');
        if (problemNameElement) {
            problemData.problemName = problemNameElement.textContent.trim();
        }




        // Description
        const descriptionElement = document.querySelector('.coding_desc__pltWY p');
        if (descriptionElement) {
            problemData["Description of the problem"] = descriptionElement.textContent.trim();
        }





        // Input Format
        const inputFormatElement = document.querySelector('.coding_input_format__pv9fS p');
        if (inputFormatElement) {
            problemData["Input format"] = inputFormatElement.textContent.trim();
        }




        // Output Format
        function scrapeOutputFormat() {
            // Find the "Output Format" heading
            const outputFormatHeading = document.querySelector('h5.problem_heading:nth-of-type(3)');

            if (outputFormatHeading && outputFormatHeading.textContent.trim() === "Output Format") {
                // If we found the correct heading, get the next sibling div
                const outputFormatDiv = outputFormatHeading.nextElementSibling;

                if (outputFormatDiv && outputFormatDiv.classList.contains('coding_input_format__pv9fS')) {
                    // Find the paragraph within this div
                    const outputFormatParagraph = outputFormatDiv.querySelector('p');

                    if (outputFormatParagraph) {
                        problemData["Output format"] = outputFormatParagraph.textContent.trim();
                    } else {
                        // console.log("Output format paragraph not found");
                    }
                } else {
                    console.log("Output format div not found");
                }
            } else {
                console.log("Output Format heading not found");
            }
        }
        // Execute the scraping function
        scrapeOutputFormat();




        // Scraping problem constraints
        function extractConstraints() {
            // Find all elements with class 'math-inline'
            const mathElements = document.querySelectorAll('.math-inline');

            let constraints = [];

            mathElements.forEach(element => {
                // Find the <semantics> element within each math element
                const semanticsElement = element.querySelector('semantics');
                if (semanticsElement) {
                    // Find the <mrow> element within <semantics>
                    const mrowElement = semanticsElement.querySelector('mrow');
                    if (mrowElement) {
                        constraints.push(mrowElement.textContent);
                    }
                }
            });

            return constraints;
        }
        const constraints = extractConstraints();
        // console.log("Constraints:", constraints);
        const constraintsString = constraints.join(', ');
        // console.log("Constraints as string:", constraintsString);
        // Make constraints in this form -> '1≤T≤100', '2≤N,M≤200
        function extractActualConstraints(input) {

            const parts = input.split(', ');

            const constraints = parts.filter(part => part.includes('≤'));
            return constraints.join(', ');
        }
        const extractedAcualConstraints = extractActualConstraints(constraintsString);
        problemData.Constraints = extractedAcualConstraints;





        // Test cases
        const sampleInputs = document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS');
        const sampleOutputs = document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS');
        let chance = 0;
        for (let i = 0; i < sampleInputs.length; i++) {
            if (chance === 0) {
                problemData.TestCases.push({
                    [`sample Input ${i}`]: sampleInputs[i].textContent.trim(),
                });
                chance++;
            } else {
                problemData.TestCases.push({
                    [`sample output ${i - 1}`]: sampleOutputs[i].textContent.trim()
                });
                chance--;
            }
        }
        // console.log("Problem data is here", problemData)
        return problemData;

    } catch (error) {
        console.error("Error while scraping data:", error);
    }
}







// --------------------------------  Sending message to AI  ---------------------------------------------





async function sendMessage(inputField, messagesContainer) {
    const message = inputField.value.trim();
    if (!message) return;
    const userMessage = { text: message, sender: "user" };
    inputField.value = "";
    const userMessageElement = document.createElement("div");
    userMessageElement.id = "user_chats";
    userMessageElement.textContent = message;
    userMessageElement.style.margin = "5px 0";
    userMessageElement.style.padding = "10px";
    userMessageElement.style.color = "#fff";
    userMessageElement.style.borderRadius = "5px";
    userMessageElement.style.backgroundColor = "#364156";
    messagesContainer.appendChild(userMessageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;


    // Fetch existing chat messages, append the new one, and save
    getChatFromSyncStorage((existingMessages) => {
        const updatedMessages = [...existingMessages, userMessage];
        saveChatToSyncStorage(updatedMessages);
    });

    const ProblemDescription =  scrapeProblemData();
    const conversationContext = Context;


    // Convert all prompt inputs into the string
    function safeStringify(value) {
        if (typeof value === 'string') {
          return value;
        }
        try {
          return JSON.stringify(value);
        } catch (error) {
          console.error('Error stringifying value:', error);
          return String(value);
        }
    }

const SYSTEM_PROMPT = `
You are now a highly skilled and friendly Data Structures and Algorithms (DSA) instructor. Your primary role is to assist students with DSA-related queries based on the problem statement, test cases, constraints, and their provided code. Follow these detailed instructions to ensure accuracy and relevance:

1. Scope of Queries:
   - Only entertain queries related to the given DSA problem and User code. If the query is unrelated, respond: 
     "This query does not relate to the given problem and cannot be addressed."
   - If a query is ambiguous, ask clarifying questions before providing a response.

2. Response Style:
   - Use simple, friendly, and approachable language.
   - For simple queries, reply in 2-3 sentences.
   - For complex queries, limit explanations to 100 to 150 words. Take your time and first make a solution or code for that problem on your own and then structure your response with step-by-step reasoning or bullet points for clarity.
   - Use examples to explain concepts but keep them concise and focused.
   - Give code of the problem only if the user asks you.

3. Handling Code and Debugging:
   - Analyze the provided code to identify logical errors, missing any edge cases, syntax issues, or inefficiencies.
   - Explain errors and suggest fixes in simple terms, highlighting relevant code snippets when necessary.
   - Perform a step-by-step walkthrough of the student's code to pinpoint where it deviates from expected behavior.
 -  Give a test case on which user code may fail and explain the solution using it.

4. Input/Output Validation:
   - Check if the input and output adhere to the problem constraints and expected formats.
   - Provide feedback on incorrect input/output handling and suggest appropriate corrections.

5. Encourage Good Practices:
   - Emphasize clean code, proper naming conventions, and optimization techniques.
   - Suggest alternate approaches or optimizations when applicable.

6. Intermediate Steps and Assumptions:
   - Use step-by-step reasoning to solve complex problems.
   - Clearly state assumptions, if any, before proceeding with the solution.

7. Structured Output Format:
   - For certain queries, present responses in a structured format like:
     - Problem Explanation: Briefly explain the issue.
     - Analysis: Highlight errors or challenges in the student's approach.
     - Solution: Provide a clear and actionable fix or explanation.

8. Error Handling:
   - If the problem statement or test cases are incomplete or unclear, politely request more details.
   - Flag potential edge cases and suggest test cases to validate the solution.

9. Use Examples and Analogies:
   - Relate abstract concepts to everyday examples for better understanding (e.g., stacks as "plates" or trees as "family hierarchies").

10. Iterative Refinement:
    - Encourage students to improve their code incrementally and guide them through debugging and optimizing iteratively.

11. Multiple Query Handling:
    - If asked multiple questions, address each one sequentially, ensuring clarity and completeness.

12. Follow-up Queries:
    - Invite students to ask follow-up questions for further clarity but stay within the scope of the given problem.

    -Output Format:

    - Don't entertain the any query outside the Problem Statement , User code and hints.
    - If user asks any question apart from the problem statement, user code and hints. Respond with "This query does not   relate to the given problem and cannot be addressed."
    - If user asking for code of the problem then respond it with this message -> "Please use official code given by AZ".
    - Keep the feedback short, friendly, and easy to understand.
    - snippet should always be code only and is optional.
    - Do not say hey everytime say only what is really required to the user as feedback and hints.
    - Keep making feedback more personal and short overrime.
    - Limit the words in feedback. Only give what is really required to the user as feedback.
    - Hints must be crisp, short and clear


    Input Context:
    Problem Name: ${safeStringify(ProblemDescription["problemName"])}
    Description of the problem: ${safeStringify(ProblemDescription["Description of the problem"])}
    Input format: ${safeStringify(ProblemDescription["Input format"])}
    Output format: ${safeStringify(ProblemDescription["Output format"])}
    Constraints: ${safeStringify(ProblemDescription["Constraints"])}
    Test Cases: ${safeStringify(ProblemDescription["TestCases"])}
    User Code: ${safeStringify(userCode)}
    Context : ${safeStringify(conversationContext)}
    User Message: ${safeStringify(message)}
`

   
    // console.log("Complete Message: first vala ", SYSTEM_PROMPT);

    const apiResponse = await callGeminiAPI(SYSTEM_PROMPT);
    // console.log("API Response:", apiResponse);

    if (apiResponse.error && apiResponse.error.code !== 0) {
        // console.log("Error: andar ", apiResponse.error.message);
        const botMessage = document.createElement("div");
        botMessage.textContent = apiResponse.error.message;
        botMessage.id = "ai_chats";
        botMessage.style.margin = "5px 0";
        botMessage.style.padding = "10px";
        botMessage.style.backgroundColor = "#1f2836";
        botMessage.style.color = "#fff";
        botMessage.style.borderRadius = "5px";
        messagesContainer.appendChild(botMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
    }
    const validData = apiResponse.candidates[0]?.content?.parts[0]?.text || "No content available";
    const actualData = { text: validData, sender: "AI" };
    const botMessage = document.createElement("div");
    botMessage.textContent = actualData.text;
    botMessage.id = "ai_chats";
    botMessage.style.margin = "5px 0";
    botMessage.style.padding = "10px";
    botMessage.style.backgroundColor = "#1f2836";
    botMessage.style.color = "#fff";
    botMessage.style.borderRadius = "5px";
    messagesContainer.appendChild(botMessage);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save the AI response
    getChatFromSyncStorage((existingMessages) => {
        const updatedMessages = [...existingMessages, actualData];
        saveChatToSyncStorage(updatedMessages);
    });
}






// ---------------Calling AI-----------------


async function callGeminiAPI(userInput) {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "contents": [
                {
                    "parts": [
                        {
                            "text": JSON.stringify(userInput)
                        }
                    ]
                }
            ]
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
        // console.log("AI API Key ", GEMINI_API_URL);
        const response = await fetch(GEMINI_API_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        // console.log("AI API Response:", data);
        return data;
    } catch (error) {
        console.error("Error in callGeminiAPI:", error);
        return {
            error: {
                code: 400,
                message: "Failed to fetch data from the API. Please try again later."
            }
        };
    }
}






// -------------------------------------------Rough Work-----------------------------------------------------



// ---------------------- Function to save chat messages to local storage   ----------------------
    // function saveChatToLocalStorage(chatMessages) {
        // const uniqueKey = generateUniqueKey();
    //     chrome.storage.local.set({ [uniqueKey]: chatMessages }, () => {
    //         if (chrome.runtime.lastError) {
    //             console.error("Error saving chat to local storage:", chrome.runtime.lastError);
    //         } else {
                // console.log("Chat messages saved successfully for key:", uniqueKey);
                // console.log("Message saved successfully for key:", chatMessages);
    //         }
    //     });
// }



//---------------------- Function to get chat messages from local storage   ----------------------
// function getChatFromLocalStorage(callback) {
    // const uniqueKey = generateUniqueKey();
//     chrome.storage.local.get([uniqueKey], (result) => {
//         if (chrome.runtime.lastError) {
//             console.error("Error fetching chat from local storage:", chrome.runtime.lastError);
//         } else {
            // console.log("Fetched chat messages:", result[uniqueKey]);
//             callback(result[uniqueKey] || []);
//         }
//     });
// }


// function clearLocalStorage() {
//     chrome.storage.local.clear(() => {
//         if (chrome.runtime.lastError) {
//             console.error("Error clearing storage:", chrome.runtime.lastError);
//         } else {
//             console.log("Local storage cleared successfully.");
//         }
//     });
// }
// clearLocalStorage();



// ------------------ Function to handle route  ------------------
// document.addEventListener("DOMContentLoaded", () => {
//     handleRouteChange();
// });
// const SYSTEM_PROMPT = `
// You are AZ Whisper, a friendly and conversational AI helper for students solving AZ problems. Your goal is to guide students step-by-step toward a solution,if user want the code then give him in their repective language by default give code in c++ .

// Input Context:

// Problem Name: ${safeStringify(ProblemDescription["problemName"])}
// Description of the problem: ${safeStringify(ProblemDescription["Description of the problem"])}
// Input format: ${safeStringify(ProblemDescription["Input format"])}
// Output format: ${safeStringify(ProblemDescription["Output format"])}
// Constraints: ${safeStringify(ProblemDescription["Constraints"])}
// Test Cases: ${safeStringify(ProblemDescription["TestCases"])}
// User Code: ${safeStringify(userCode)}
// User Message: ${safeStringify(message)}
// Context : ${safeStringify(conversationContext)}

// Your Tasks:

// Analyze User Code:

// - Spot mistakes or inefficiencies in ${safeStringify(userCode)}.
// - Start with small feedback and ask friendly follow-up questions, like where the user needs help.
// - Keep the conversation flowing naturally, like you're chatting with a friend. 😊

// Provide Hints:

// - Use context appropriatly for making your new user query response.
// - Share concise, relevant hints based on ${safeStringify(ProblemDescription["Description of the problem"])}.
// - Let the user lead the conversation—give hints only when necessary.
// - Avoid overwhelming the user with too many hints at once.

// Suggest Code Snippets:

// - Share tiny, focused code snippets only when they’re needed to illustrate a point.

// Output Requirements:
// - Don't entertain the any query outside the Problem Statement , User code and hints.
// - If user asks any question apart from the problem statement, user code and hints. Respond with "This query does not relate to the given problem and cannot be addressed."
// - Keep the feedback short, friendly, and easy to understand.
// - snippet should always be code only and is optional.
// - Do not say hey everytime
// - Keep making feedback more personal and short overrime.
// - Limit the words in feedback. Only give what is really required to the user as feedback.
// - Hints must be crisp, short and clear


// Tone & Style:

// - Be kind, supportive, and approachable.
// - Use emojis like 🌟, 🙌, or ✅ to make the conversation fun and engaging.
// - Avoid long, formal responses—be natural and conversational.

// `;

 // async function loadPrompts() {
    //     try {
    //         const promptURL = chrome.runtime.getURL('assets/Prompts.js');
    //         console.log("Loading prompts from:", promptURL);
    //         const response = await fetch(promptURL); // Replace with your URL

    //         if (!response.ok) {
    //             const message = `An error occurred: ${response.status} ${response.statusText}`;
    //             console.error(message);
                // Display an error message to the user (e.g., using an alert, or updating the DOM)
    //             alert(message);  // Or a better UI element
    //             throw new Error(message); // Re-throw the error to stop further execution if needed
    //         }

    //         const data = await response.json();
            // Use the prompts data
    //         prompts = data;
    //         console.log("Prompts loaded successfully:", data);

    //     } catch (error) {
    //         console.error("Failed to load the prompts file:", error);
            // Display an appropriate error message to the user
    //         alert("Failed to load prompts. Please try again later."); // Or better UI feedback
    //     }
    // }

    // Call the function
    // loadPrompts();

    // try {


        // fetching prompts 

        // await fetch(prompts)
        //     .then(response => {
        //         return response.text();
        //     })
        //     .then(data => {
        //         console.log("Dummy Data File Content:", data);
        //         prompts = data.split("\n");
        //         console.log("Prompts:", prompts);
        //     })
        //     .catch(error => {
        //         console.error("Error reading dummy data file:", error);
        //     });

        // await fetch("promptsUrl")
        //     .then(response => response.text())
        //     .then(data => {
        //         prompts = data;
        //         console.log(data); 
        //     });

    // } catch (error) {
    //     console.error("Unexpected error:", error);
    //     const botMessage = document.createElement("div");
    //     botMessage.textContent = "An unexpected error occurred. Please try again.";
    //     botMessage.style.margin = "5px 0";
    //     botMessage.style.padding = "10px";
    //     botMessage.style.backgroundColor = "#1f2836";
    //     botMessage.style.color = "#fff";
    //     botMessage.style.borderRadius = "5px";
    //     messagesContainer.appendChild(botMessage);
    //     messagesContainer.scrollTop = messagesContainer.scrollHeight;
    // }

    // const ActualQueryToSendAI = { CompleteMessage};