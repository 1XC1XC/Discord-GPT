const { Client, GatewayIntentBits } = require("discord.js")
const config = require("../config.json")
const route = require("./handlers/commands")
const WhisperClient = require("../whisper/client")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
})

const whisperClient = new WhisperClient()

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return

    await route(message, { whisperClient })
})

process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error)
})

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error)
    process.exit(1)
})

client.login(config.discord.token).catch((error) => {
    console.error("Failed to login:", error)
    process.exit(1)
})
