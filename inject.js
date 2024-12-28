(function () {
    console.log("Inject.js loaded and running!");

    // Save the original fetch method
    const originalFetch = window.fetch;

    // Override the fetch method
    window.fetch = function (url, options) {
        // Intercept the fetch request and log its data
        const requestDetails = { url: url, method: options?.method || 'GET', headers: options?.headers };

        // Call the original fetch method
        return originalFetch(url, options)
            .then(response => {
                // Log response data
                const data = { 
                    url: url, 
                    status: response.status, 
                    response: response.clone().text() 
                };
                console.log("Fetch Request Data:", data);

                // Dispatch the custom event with the data
                response.clone().text().then(text => {
                    data.response = text;
                    window.dispatchEvent(new CustomEvent("xhrDataFetched", { detail: data }));
                    console.log("xhrDataFetched event dispatched with data:", data);
                });

                return response; // Return the response
            })
            .catch(error => {
                console.error("Fetch request failed", error);
                // Optionally, handle failed requests here
            });
    };
})();
