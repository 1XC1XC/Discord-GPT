const cheerio = require("cheerio")
const axios = require("axios")

class WebTools {
    constructor() {
        this.baseURL = "https://html.duckduckgo.com/html/?q="
    }

    async webSearch(query) {
        try {
            const response = await axios.get(
                this.baseURL + encodeURIComponent(query),
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        Accept: "text/html",
                        "Accept-Language": "en-US,en;q=0.5",
                    },
                },
            )

            const $ = cheerio.load(response.data)
            const results = []

            $("#links .result").each((i, element) => {
                const $element = $(element)
                const title = $element.find(".result__title").text().trim()
                const link = $element.find(".result__a").attr("href")
                const snippet = $element.find(".result__snippet").text().trim()

                if (title && link) {
                    results.push({ title, url: link, snippet })
                }
            })

            return results
        } catch (error) {
            console.error("Web search error:", error)
            return []
        }
    }

    async siteSearch(url) {
        console.log("")
        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            })

            const $ = cheerio.load(response.data)

            $("script, style").remove()

            return $("body").text().trim().replace(/\s+/g, " ")
        } catch (error) {
            console.error("Site search error:", error)
            return null
        }
    }
}

module.exports = WebTools
