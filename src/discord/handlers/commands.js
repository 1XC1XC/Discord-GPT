const { handleAsk, handleClear } = require("./message")
const { processMessage } = require("./audio")
const config = require("../../config.json")

const parseCommand = (content) => {
    if (!content) return { command: null, args: [] }

    const prefix = config.discord.prefix
    if (!content.startsWith(prefix)) return { command: null, args: [] }

    const trimmed = content.slice(prefix.length).trim()
    const [command, ...args] = trimmed.split(/\s+/)

    return { command: command.toLowerCase(), args }
}

const handleError = async (message, error) => {
    const errorMsg = await message.channel.send(error)
    setTimeout(() => errorMsg.delete().catch(() => {}), 3000)
}

const handleAskCommand = async (message, args, options = {}) => {
    const question = args.join(" ")
    if (!question && !message.attachments.size) {
        await handleError(
            message,
            "❌ Please provide a question or audio message!",
        )
        return
    }

    if (options.whisperClient && message.attachments.size > 0) {
        const transcribedText = await processMessage(
            message,
            options.whisperClient,
        )
        if (transcribedText) {
            const fullQuestion = question
                ? `${question} ${transcribedText}`
                : transcribedText

            await handleAsk(message, fullQuestion)
            return
        }
    }

    await handleAsk(message, question)
}

const commands = {
    ask: handleAskCommand,
    clear: handleClear,
    default: async (message, command) =>
        await handleError(message, `❓ Unknown command: ${command}`),
}

const route = async (message, options = {}) => {
    if (options.whisperClient && message.attachments.size > 0) {
        const transcribedText = await processMessage(
            message,
            options.whisperClient,
        )
        if (transcribedText) {
            await handleAsk(message, transcribedText)
            return
        }
    }

    const { command, args } = parseCommand(message.content)
    if (!command) return

    const handler = commands[command] || commands.default
    await handler(message, args, options)
}

module.exports = route
