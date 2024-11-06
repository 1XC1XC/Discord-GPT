const { Client, GatewayIntentBits } = require("discord.js")
const { loadHistory, saveHistory } = require("./history.js")
const OllamaAPI = require("../llama")
const WhisperClient = require("../whisper/src/js")

const createDiscordClient = () => {
    return new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ],
    })
}

const initializeState = () => ({
    ollama: new OllamaAPI(),
    whisper: new WhisperClient(),
    history: loadHistory(),
})

const handleAudioAttachment = async (
    audioAttachment,
    userId,
    whisperClient,
) => {
    try {
        if (!audioAttachment || !audioAttachment.url) {
            throw new Error(
                "Invalid audio attachment - missing required properties",
            )
        }

        const isValidUrl = await whisperClient.validateURL(audioAttachment.url)
        if (!isValidUrl) {
            throw new Error("Audio URL validation failed")
        }

        const transcription = await whisperClient.transcribeFromURL(
            audioAttachment.url,
            userId,
        )

        //console.log("Transcription completed successfully:", {
        //    length: transcription?.transcription?.length,
        //    language: transcription?.language,
        //    confidence: transcription?.language_probability,
        //})

        return transcription
    } catch (error) {
        console.error("\n=== Audio Processing Error ===")
        console.error("Error Type:", error.name)
        console.error("Error Message:", error.message)

        if (error.response) {
            console.error("Server Response:", {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            })
        }

        if (error.request) {
            console.error("Request Details:", {
                method: error.request.method,
                path: error.request.path,
                headers: error.request.getHeaders?.(),
            })
        }

        console.error("Stack Trace:", error.stack)
        console.error("=== Error Report End ===\n")

        throw error
    }
}

const messageHandlers = {
    ask: async (message, state) => {
        const { channel, content, author, audioAttachment, originalMessage } =
            message

        try {
            let userResponse = content || ""
            let progressMsg = await channel.send("🤔 Thinking...")

            if (audioAttachment) {
                await progressMsg.edit("🤔 Listening...")
                const audio = await handleAudioAttachment(
                    audioAttachment,
                    author.id,
                    state.whisper,
                )
                const audioText = audio.transcription.trim()
                userResponse = audioText.trim()

                if (originalMessage?.deletable) {
                    await originalMessage.delete().catch((err) => {
                        console.error("[ERROR] Failed to delete message:", err)
                    })
                }

                await channel.send({
                    content: `🗣️ **${author.username}**\n> ${userResponse.replace(/\n/g, "")}`,
                })
            }

            await progressMsg.edit({
                content: "🤔 Processing response...",
            })

            if (!userResponse.trim()) {
                await progressMsg.edit(
                    "⚠️ No content to process. Please provide text or audio.",
                )
                return
            }

            state.history = updateHistory(state.history, author.id, {
                role: "user",
                content: userResponse,
            })

            const response = await state.ollama.chat(state.history[author.id])

            await progressMsg.delete().catch(() => {})
            await handleResponse(message, response, state)
            saveHistory(state.history)
        } catch (error) {
            console.error("⚠️ Error:", error)
            await channel.send(
                "⚠️ Error processing your request. Please try again.",
            )
        }
    },

    clearhistory: ({ channel, author }, state) => {
        state.history[author.id] = []
        saveHistory(state.history)
        channel.send("🗑️ Conversation history cleared.")
    },
}

const handleResponse = async ({ channel, author }, response, state) => {
    if (!response?.message?.content) {
        await channel.send(
            "⚠️ Received an unexpected response format from the AI.",
        )
        return
    }

    const content = response.message.content
    state.history = updateHistory(state.history, author.id, {
        role: "assistant",
        content: content,
    })

    await sendResponse(content, channel)
}

const updateHistory = (history, authorId, message) => {
    if (!history[authorId]) {
        history[authorId] = []
    }
    history[authorId].push(message)
    return history
}

const processContent = (content) => {
    if (typeof content !== "string") {
        return ""
    }
    return content.replace(/\n\n/g, "\n").trim()
}

const createAttachment = (content) => ({
    attachment: Buffer.from(content, "utf-8"),
    name: "response.txt",
})

const sendResponse = async (content, channel) => {
    const processedContent = processContent(content)
    if (!processedContent) {
        await channel.send("⚠️ Received an empty response from the AI.")
        return
    }

    if (processedContent.length > 2000) {
        await channel.send({
            content:
                "📄 The response is too long, please see the attached file:",
            files: [createAttachment(processedContent)],
        })
    } else {
        await channel.send(
            `🐵 **AI**\n> ➜ ${processedContent.replace(/\n/g, " ")}`,
        )
    }
}

const parseCommand = (content = "") => {
    if (!content?.trim()) {
        return { command: null, content: "" }
    }

    if (content.charAt(0) !== ".") {
        return { command: null, content }
    }

    const [command, ...args] = content.slice(1).trim().split(" ")
    return {
        command: command || null,
        content: args.join(" "),
    }
}

const isValidMessage = (message) => {
    const hasAudioAttachment = message.attachments.some((att) =>
        att.contentType?.startsWith("audio/"),
    )

    return (
        !message.author.bot &&
        (hasAudioAttachment ||
            (message.content?.length > 0 && message.content.charAt(0) === "."))
    )
}

const setupMessageHandler = (client, state) => {
    client.on("messageCreate", async (message) => {
        if (!isValidMessage(message)) {
            return
        }

        const { command, content } = parseCommand(message.content)
        const audioAttachment = message.attachments.find((att) =>
            att.contentType?.startsWith("audio/"),
        )

        const effectiveCommand = audioAttachment ? command || "ask" : command

        const handler = messageHandlers[effectiveCommand]
        if (handler) {
            await handler(
                {
                    channel: message.channel,
                    content: content,
                    author: message.author,
                    audioAttachment: audioAttachment,
                    originalMessage: message,
                },
                state,
            )
        } else {
            await message.channel.send(
                "❓ Unknown command. Please use `.ask` or `.clearhistory`.",
            )
        }
    })
}

const initializeBot = () => {
    const client = createDiscordClient()
    const state = initializeState()

    client.once("ready", () => {
        console.log(`✅ Logged in as ${client.user.tag}!`)
    })

    setupMessageHandler(client, state)

    client.login(process.env.DISCORD_TOKEN)
}

initializeBot()
