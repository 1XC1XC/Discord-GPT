const fs = require("fs")
const path = require("path")

const historyPath = path.join(__dirname, "conversation.json")

const ensureHistoryFile = () => {
    if (!fs.existsSync(historyPath))
        fs.writeFileSync(historyPath, JSON.stringify({}), "utf-8")
}

const loadHistory = (userId) => {
    ensureHistoryFile()
    try {
        const data = fs.readFileSync(historyPath, "utf-8")
        const history = JSON.parse(data)
        return history[userId] || []
    } catch (err) {
        console.error("Failed to load history:", err)
        return []
    }
}

const saveHistory = (userId, history) => {
    ensureHistoryFile()
    try {
        const currentHistory = fs.existsSync(historyPath)
            ? JSON.parse(fs.readFileSync(historyPath, "utf-8"))
            : {}

        currentHistory[userId] = history
        fs.writeFileSync(historyPath, JSON.stringify(currentHistory, null, 2))
    } catch (err) {
        console.error("Failed to save history:", err)
        throw new Error(`History save failed: ${err.message}`)
    }
}

const add = (userId, interaction) => {
    const history = loadHistory(userId)

    history.push({
        role: "user",
        content: interaction.question,
    })

    if (interaction.response) {
        history.push({
            role: "assistant",
            content: interaction.response,
        })
    }

    saveHistory(userId, history)
}

const clear = (userId) => {
    saveHistory(userId, [])
}

const getHistory = (userId) => {
    return loadHistory(userId)
}

module.exports = {
    add,
    clear,
    getHistory,
}
