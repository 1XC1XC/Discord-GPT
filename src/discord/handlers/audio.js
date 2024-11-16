const handleTranscription = async (message, audioAttachment, whisperClient) => {
    let progressMsg = null

    try {
        progressMsg = await message.channel.send("🎧 Listening...")

        const transcription = await whisperClient.transcribeFromURL(
            audioAttachment.url,
            message.author.id,
        )

        if (!transcription?.transcription)
            throw new Error("No transcription data received")

        const transcribedText = transcription.transcription.trim()
        await message.channel.send(
            `🗣️ **${message.author.username}**\n> ${transcribedText.replace(/\n/g, "\n> ")}`,
        )

        await cleanup(message, progressMsg)

        return {
            error: false,
            text: transcribedText,
            language: transcription.language,
            confidence: transcription.language_probability,
        }
    } catch (err) {
        if (progressMsg?.deletable) {
            await progressMsg.edit("❌ Failed to process audio")
            setTimeout(() => progressMsg.delete().catch(() => {}), 3000)
        }
        return { error: true, message: "Error processing audio file" }
    }
}

const processMessage = async (message, whisperClient) => {
    const audioAttachment = message.attachments.find((att) =>
        att.contentType?.startsWith("audio/"),
    )

    if (!audioAttachment) return null

    const result = await handleTranscription(
        message,
        audioAttachment,
        whisperClient,
    )
    return result.error ? null : result.text
}

const cleanup = async (message, progressMsg) => {
    if (progressMsg?.deletable) await progressMsg.delete().catch(() => {})
    if (message.deletable) await message.delete().catch(() => {})
}

module.exports = {
    handleTranscription,
    processMessage,
}
