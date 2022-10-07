require('dotenv').config() // load secrets

// discord API keys/id's
const APPLICATION_ID = process.env.APPLICATION_ID 
const TOKEN = process.env.TOKEN 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 

// axios / express / discord interactions
const axios = require('axios')
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

const app = express();

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
	'Access-Control-Allow-Headers': 'Authorization',
	'Authorization': `Bot ${TOKEN}`
  }
});



// TARKOV DEV
const tarkovDev = axios.create({
  baseURL: 'https://api.tarkov.dev',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
})

app.get('/tarkov', async (req,res) =>{

  let query = { 
    "operationName": "",
    "query": `query items(type: gun) { properties { __typename ... on ItemPropertiesWeapon { defaultPreset { name shortName inspectImageLink }}}}`,
    "variables": {}
  }

  try
  {
    let tarkovDevResponse = await tarkovDev.post('/graphql', query)
    return res.send(tarkovDevResponse.data)
  }catch(e){
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} from tarkov.dev`)
  }
})

// MAIN
const settings = {
  'maps': ['Labs', 'Customs', 'Shoreline', 'Factory', 'Lighthouse', 'Interchange', 'Reserve', 'Woods'],
  'games': ['tarkov', 'DAYZ', 'hunt:showdown', 'battlebit']
}

// utility
function rollArr(arr) {
  return arr[Math.floor(Math.random() * arr.length )]
}

// receive interactions
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name)

    // Random map generator
    if(interaction.data.name == 'map'){

      let map = '';

      if(interaction.data.options[0].name == 'includelabs') {
        map = rollArr(settings.maps);
      }
      
      if(interaction.data.options[0].name == 'excludelabs') {
        map = rollArr(settings.maps.slice(1));
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Have fun on ${map}!`,
        },
      });
    }
    
    // Random game generator
    if(interaction.data.name == 'game'){

    }

    // Random game generator
    if(interaction.data.name == 'scavorpmc'){

    }
  }

});


// register interaction commands "/?"
app.get('/register_commands', async (req,res) =>{
  let slash_commands = [
    {
      'name': 'map',
      'description': 'Random map generator.',
      'options': [
        {
          'name': 'includelabs',
          'description': 'Random map generator. Include Labs.',
          'type': 1
        },
        {
          'name': 'excludelabs',
          'description': 'Random map generator. Exclude Labs.',
          'type': 1
        }
      ]
    },

    {
      'name': 'game',
      'description': 'Random game generator',
      'options': []
    },

    {
      'name': 'scavorpmc',
      'description': 'Fun or burden?',
      'options': []
    }
  ]
  try
  {
    // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
    let discord_response = await discord_api.put(
      `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      slash_commands
    )
    console.log(discord_response.data)
    return res.send('commands have been registered')
  }catch(e){
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} error from discord`)
  }
})

app.get('/', async (req,res) =>{
  return res.send('Follow documentation ')
})

app.listen(8999, () => {})


// # TODO https://github.com/x0rtex/TarkovLoadoutLottery
// tarkov.dev API graphql
// https://github.cdnweb.icu/topics/escape-from-tarkov



/*
console.log("test");
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

// wich game 
const games = ["tarkov", "DAYZ", "hunt:showdown"];

client.on("messageCreate", msg => {
  if (msg.content === "!game") {
    msg.reply( games[Math.floor(Math.random() * games.length )] );
  }
})


// tarkov wich map
const tarkovMaps = ["Labs", "Customs", "Shoreline", "Factory", "Lighthouse", "Interchange", "Reserve", "Woods"];

async function waitForAnswer(incomingMsg) {
  let promise = new Promise((resolve) => { 
    client.on("messageCreate", msg => {
      if(incomingMsg.author.username === msg.author.username & msg.content === "yes") {
        resolve("Have fun on " + )
      }
      if(incomingMsg.author.username === msg.author.username & msg.content === "no") {
        resolve("I hope you're not lying to me. Go play on " + )
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


// FOOD
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
*/