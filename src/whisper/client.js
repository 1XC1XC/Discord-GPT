const axios = require("axios")

module.exports = class {
    constructor(baseURL = "http://localhost:8000") {
        this.baseURL = baseURL
    }

    async transcribeFromURL(audioURL, userId) {
        if (!audioURL || !userId) throw new Error("Missing required parameters")

        try {
            const { data } = await axios.post(
                `${this.baseURL}/transcribe`,
                null,
                {
                    params: { url: audioURL, user_id: userId },
                    headers: { "Content-Type": "application/json" },
                },
            )
            return data
        } catch (err) {
            throw new Error(
                err.response?.status
                    ? `Transcription failed: ${err.response.status}`
                    : "Network error",
            )
        }
    }
}
