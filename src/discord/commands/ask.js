const ollama = require("../../llm/ollama")
const history = require("../utils/history")
const config = require("../../config.json")

module.exports = async (message, args) => {
    if (args.length === 0) {
        return message.reply("Please provide a question to ask.")
    }

    const question = args.join(" ")
    const userId = message.author.id

    try {
        const response = await ollama.chat(question)
        console.log(response)
        message.channel.send(response)
        history.add(userId, { question, response })
    } catch (error) {
        console.error("Error processing ask command:", error)
        message.reply(
            "There was an error processing your question. Please try again later.",
        )
    }
}
