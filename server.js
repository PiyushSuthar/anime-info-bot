import dotenv from 'dotenv'
dotenv.config()

import Telebot from "node-telegram-bot-api";
import axios from 'axios'

const TOKEN = process.env.TOKEN

const bot = new Telebot(TOKEN, {
    polling: true
})

/**
 * @param {string} name 
 */
async function getAnimeInfo(name = "death note") {
    let api = `https://kitsu.io/api/edge/anime?filter[text]=${name}&page[limit]=1`
    const data = await (await axios.get(api)).data
    return data.data.length !== 0 ? parseAnimeInfo(data?.data[0]) : false
}

// Parsing data
function parseAnimeInfo(data) {
    const { attributes } = data
    return {
        name: attributes.titles.en || attributes.canonicalTitle,
        description: attributes.description,
        image: attributes.coverImage?.original || attributes.posterImage?.original,
        episodeCount: attributes.episodeCount,
        averageRating: attributes.averageRating,
        episodeAverageLength: attributes.episodeLength,
        startDate: attributes.startDate,
        endDate: attributes.endDate,
        slug: attributes.slug
    }
}

function generateMessage(data) {
    return `
${data.name}

⏲ Started: ${data.startDate}
⏲ Ended: ${data.endDate}

⭐ ${data.averageRating}

Total Episodes : ${data.episodeCount}
Avergae Episode Length : ${data.episodeAverageLength} minutes
    `
}

function sendNotFound(CHAT_ID, message = "Sorry, But I failed to find the anime.") {
    bot.sendMessage(CHAT_ID, message)
}

function generateCaptionDescription(data) {
    return `
${data.description.split(/\n/gm)[0]}
    
🔗 <a href="https://kitsu.io/anime/${data.slug}">Learn More</a>
    `
}

bot.onText(/\/anime (.+)/, async (msg, match) => {
    let animeName = match[1]
    let CHAT_ID = msg.chat.id
    let reply = msg.message_id
    // try {
        const animeData = await getAnimeInfo(animeName)
        if (animeData) {
            let caption = generateMessage(animeData)

            if(animeData.image) {
                await bot.sendPhoto(CHAT_ID, animeData.image, {
                    caption,
                    reply_to_message_id: reply
                })
                await bot.sendMessage(CHAT_ID, generateCaptionDescription(animeData), {
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                })
            } else{
                bot.sendMessage(CHAT_ID,caption)
            }
        } else {
            sendNotFound(CHAT_ID)
        }

    // } catch (error) {
    //     sendNotFound(CHAT_ID, "faced some errors :(")
    //     sendNotFound(CHAT_ID, JSON.stringify(error))
    // }
})
