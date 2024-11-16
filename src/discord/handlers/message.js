const { chat } = require("../../llm/ollama")
const history = require("../utils/history")
const config = require("../../config.json")

const sendResponse = async (message, reply) => {
    if (reply.length > 2000) {
        return message.reply({
            content:
                "📄 The response is too long, please see the attached file:",
            files: [
                {
                    attachment: Buffer.from(reply, "utf-8"),
                    name: "response.txt",
                },
            ],
        })
    }

    return message.channel.send(
        `🤖 **AI:** *${config.llm.model}*\n> ${reply.replace(/\n/g, "\n> ")}`,
    )
}

const handleAsk = async (message, content) => {
    try {
        const userId = message.author.id
        const userHistory = history.getHistory(userId)
        const progressMsg = await message.channel.send("🤔 Thinking...")

        const response = await chat([...userHistory, { role: "user", content }])

        const reply = response.message?.content || response.response
        await sendResponse(message, reply)
        await progressMsg.delete().catch(() => {})

        history.add(userId, { question: content, response: reply })
    } catch (err) {
        await message.reply(
            "⚠️ Sorry, I encountered an error processing your request.",
        )
    }
}

const handleClear = async (message) => {
    try {
        history.clear(message.author.id)
        const reply = await message.channel.send(
            "🗑️ Conversation history has been cleared.",
        )

        setTimeout(() => reply.delete().catch(() => {}), 10000)
    } catch (err) {
        await message.reply(
            "⚠️ Sorry, I encountered an error clearing your history.",
        )
    }
}

module.exports = {
    handleAsk,
    handleClear,
    sendResponse,
}
