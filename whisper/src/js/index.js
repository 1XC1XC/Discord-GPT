const axios = require("axios")

class WhisperClient {
    constructor(baseURL = "http://localhost:8000") {
        this.baseURL = baseURL
    }

    async transcribeFromURL(audioURL, userId) {
        try {
            const response = await axios.post(
                `${this.baseURL}/transcribe`,
                {
                    transcription_request: { url: audioURL },
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    params: { user_id: userId },
                },
            )
            return response.data
        } catch (error) {
            console.error("[ERROR] Server responded with error:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            })
            throw error
        }
    }

    async validateURL(url) {
        try {
            const response = await axios.head(url)
            return response.status === 200
        } catch (error) {
            console.error("[ERROR] URL validation failed:", error.message)
            return false
        }
    }
}

module.exports = WhisperClient
