const config = require("../config.json")
const axios = require("axios")

const baseURL = `http://localhost:${config.llm.port}`
const model = config.llm.model

const createSystemMessage = () => {
    return {
        role: "system",
        content: `You are an adaptable and responsive AI assistant, dedicated to providing accurate and relevant information while fostering positive and meaningful interactions.`,
    }
}

const postRequest = async (endpoint, data) => {
    const url = `${baseURL}${endpoint}`
    try {
        const response = await axios.post(url, data, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response.data
    } catch (error) {
        console.error("[ERROR] HTTP error!", error.response?.status)
        console.error("[ERROR] Response data:", error.response?.data)
        throw new Error(`HTTP error! status: ${error.response?.status}`)
    }
}

const chat = async (messages) => {
    const formattedMessages = messages.map(({ role, content }) => ({
        role,
        content,
    }))

    const data = {
        model,
        messages: [createSystemMessage(), ...formattedMessages],
        stream: false,
    }

    try {
        const response = await postRequest("/api/chat", data)
        return response
    } catch (error) {
        console.warn("Chat endpoint failed, falling back to generate endpoint")
        const lastMessage = messages[messages.length - 1]

        const historyContext = messages
            .slice(0, -1)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")

        const prompt = historyContext
            ? `${historyContext}\nuser: ${lastMessage.content}`
            : lastMessage.content

        const generateData = {
            model,
            prompt,
            stream: false,
        }
        const response = await postRequest("/api/generate", generateData)
        return {
            message: {
                role: "assistant",
                content: response.response,
            },
        }
    }
}

module.exports = {
    chat,
}
