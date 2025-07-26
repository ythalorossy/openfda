const DEFAULT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 30000, // 30 seconds
};
// Helper function to determine if error is retryable
function isRetryableError(error) {
    // Network errors, timeouts, and 5xx server errors are retryable
    if (error.name === "TypeError" && error.message.includes("fetch"))
        return true;
    if (error.name === "AbortError")
        return true;
    if (error.status >= 500 && error.status <= 599)
        return true;
    if (error.status === 429)
        return true; // Rate limit
    return false;
}
// Sleep utility for retry delays
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Enhanced OpenFDA request function
async function makeOpenFDARequest(url, config = {}) {
    const { maxRetries, retryDelay, timeout } = { ...DEFAULT_CONFIG, ...config };
    const headers = {
        "User-Agent": "@ythalorossy/openfda",
        Accept: "application/json",
    };
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Create abort controller for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            console.log(`Making OpenFDA request (attempt ${attempt + 1}/${maxRetries + 1}): ${url}`);
            const response = await fetch(url, {
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            // Handle HTTP errors with OpenFDA-specific context
            if (!response.ok) {
                const errorText = await response
                    .text()
                    .catch(() => "Unable to read error response");
                const httpError = {
                    type: "http",
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                    details: errorText,
                };
                console.error(`OpenFDA HTTP Error (${response.status}):`, {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText.substring(0, 200), // Truncate long error messages
                });
                // OpenFDA-specific status code handling
                switch (response.status) {
                    case 400:
                        httpError.message = `Bad Request: Invalid search query or parameters`;
                        break;
                    case 401:
                        httpError.message = `Unauthorized: Invalid or missing API key`;
                        break;
                    case 403:
                        httpError.message = `Forbidden: API key may be invalid or quota exceeded`;
                        break;
                    case 404:
                        httpError.message = `Not Found: No results found for the specified query`;
                        break;
                    case 429:
                        httpError.message = `Rate Limited: Too many requests. Retrying...`;
                        break;
                    case 500:
                        httpError.message = `Server Error: OpenFDA service is experiencing issues`;
                        break;
                    default:
                        httpError.message = `HTTP Error ${response.status}: ${response.statusText}`;
                }
                lastError = httpError;
                // Don't retry client errors (4xx) except rate limiting
                if (response.status >= 400 &&
                    response.status < 500 &&
                    response.status !== 429) {
                    break;
                }
                // Retry server errors and rate limits
                if (attempt < maxRetries &&
                    isRetryableError({ status: response.status })) {
                    const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await sleep(delay);
                    continue;
                }
                break;
            }
            // Parse JSON response
            let parsedData;
            try {
                parsedData = await response.json();
            }
            catch (parseError) {
                const parsingError = {
                    type: "parsing",
                    message: `Failed to parse JSON response: ${parseError instanceof Error
                        ? parseError.message
                        : "Unknown parsing error"}`,
                    details: parseError,
                };
                console.error("OpenFDA JSON Parsing Error:", {
                    url,
                    parseError: parseError instanceof Error ? parseError.message : parseError,
                });
                lastError = parsingError;
                break; // Don't retry parsing errors
            }
            // Check for empty response
            if (!parsedData) {
                const emptyError = {
                    type: "empty_response",
                    message: "Received empty response from OpenFDA API",
                };
                lastError = emptyError;
                break;
            }
            console.log(`OpenFDA request successful on attempt ${attempt + 1}`);
            return { data: parsedData, error: null };
        }
        catch (error) {
            // Handle network errors, timeouts, and other fetch errors
            let networkError;
            if (error.name === "AbortError") {
                networkError = {
                    type: "timeout",
                    message: `Request timeout after ${timeout}ms`,
                    details: error,
                };
            }
            else if (error instanceof TypeError &&
                error.message.includes("fetch")) {
                networkError = {
                    type: "network",
                    message: `Network error: Unable to connect to OpenFDA API`,
                    details: error.message,
                };
            }
            else {
                networkError = {
                    type: "unknown",
                    message: `Unexpected error: ${error.message || "Unknown error occurred"}`,
                    details: error,
                };
            }
            console.error(`OpenFDA Request Error (attempt ${attempt + 1}):`, {
                url,
                error: error.message,
                type: error.name,
            });
            lastError = networkError;
            // Retry network errors and timeouts
            if (attempt < maxRetries && isRetryableError(error)) {
                const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
                console.log(`Network error, retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            break;
        }
    }
    return { data: null, error: lastError };
}
export { makeOpenFDARequest };
