const fs = require("fs")
const path = require("path")

const historyFilePath = path.join(__dirname, "conversation.json")

function loadHistory() {
    if (fs.existsSync(historyFilePath)) {
        const data = fs.readFileSync(historyFilePath, "utf-8")
        return JSON.parse(data)
    }

    return {}
}

function saveHistory(history) {
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2))
}

module.exports = {
    loadHistory,
    saveHistory,
}
