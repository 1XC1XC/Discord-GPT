const history = require("../utils/history")

module.exports.execute = (message) => {
    const userId = message.author.id
    history.clear(userId)
    message.reply("Your history has been cleared.")
}
