
// const { clientId, guildId, token, publicKey } = require('./config.json');
require('dotenv').config()
const APPLICATION_ID = process.env.APPLICATION_ID 
const TOKEN = process.env.TOKEN 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 


console.log("NodeJS Version: " + process.version)


const { Client, Intents, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers ] });



client.login(TOKEN).catch(console.error);

client.on('debug', console.log);


client.once('ready', () => {
	console.log('Ready!');
});

client.on("messageCreate", function (message) {
  if (message.author.equals(client.user)) return; // Ignores itself
});

// Chatbot
function rollArr(arr) {
  return arr[Math.floor(Math.random() * arr.length )]
}

/* wich game */
const games = ["tarkov", "DAYZ", "hunt:showdown"];

client.on("messageCreate", msg => {
  if (msg.content === "!game") {
    msg.reply( games[Math.floor(Math.random() * games.length )] );
  }
})


/* tarkov wich map */
const tarkovMaps = ["Labs", "Customs", "Shoreline", "Factory", "Lighthouse", "Interchange", "Reserve", "Woods"];

async function waitForAnswer(incomingMsg) {
  let promise = new Promise((resolve) => { 
    client.on("messageCreate", msg => {
      if(incomingMsg.author.username === msg.author.username & msg.content === "yes") {
        resolve("Have fun on " + rollArr(tarkovMaps))
      }
      if(incomingMsg.author.username === msg.author.username & msg.content === "no") {
        resolve("I hope you're not lying to me. Go play on " + rollArr(tarkovMaps.slice(1)))
      }
    }) 
  });
  let result = await promise;
  incomingMsg.reply(result);
}

client.on("messageCreate", msg => {
  if (msg.content === "!map"){
    msg.reply("I need to know: Do you own a labs access keycard?");
    waitForAnswer(msg)
  }
})


/* FOOD */
const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));
const jsdom = require("jsdom")
const { JSDOM } = jsdom;
global.DOMParser = new JSDOM().window.DOMParser;

    client.on("messageCreate", msg => {
        if (msg.content === "!hungry" || msg.content === "!fuckinghungrygivemeafuckingrecipealreadyyoufuck") {
            msg.reply("one sec..");

            fetch('https://www.dammitwhatdoyouwant.co.uk/fetch.php?gluten=0&vegetarian=0')
            .then(function (response) { return response.text();})
            .then(function (html) {
        
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const rowA = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('Frühstück').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="breakfast"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('Brunch').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="brunch"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('MITTACH').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="lunch"]').attributes[0].nodeValue)
                );
                const rowB = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('DU SNACK').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="snack"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('Abend *').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="dinner"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('Süßes!').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="dessert"]').attributes[0].nodeValue)
                );
                const embed = new EmbedBuilder()
                    .setColor(0x4B69B6)
                    .setTitle('DU BIST HUNGRIG? 2.0')
                    .setDescription('WAS WILLSTE FUTTERN?');
        
                msg.reply({embeds: [embed], components: [rowA,rowB] });
            })

            .catch(function (err) { console.warn('ERR', err); });
        }
    });