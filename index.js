require('dotenv').config() // load secrets

// discord API keys/id's
const APPLICATION_ID = process.env.APPLICATION_ID 
const TOKEN = process.env.TOKEN 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 
const KUSCHELECKE = '580104185559777326'

// axios / express / discord interactions
const axios = require('axios')
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const { connect } = require('http2')

const app = express();

// DISCORD API
const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
	'Access-Control-Allow-Headers': 'Authorization',
	'Authorization': `Bot ${TOKEN}`
  }
});

// TARKOV DEV API
const tarkovDev = axios.create({
  baseURL: 'https://api.tarkov.dev',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

app.get('/tarkov', async (req,res) =>{

  // Tarkov-Roulette // tarkov.dev GraphQL Query CONTENT
  let query = { 
    "operationName": "",
    "query": `query { items(type: gun) { properties { __typename ... on ItemPropertiesWeapon { defaultPreset { shortName inspectImageLink }}}} }`,
    "variables": {}
  }
  // Tarkov-Roulette // tarkov.dev GraphQL Query action
  try
  {
    // send graphQl query to tarkov.dev
    let tarkovDevResponse = await tarkovDev.post('/graphql', query)
    let items = tarkovDevResponse.data.data.items

    // exclude items without defaultPreset
    let itemsFiltered = items.filter((item) => { return item.properties.defaultPreset != null })
    
    let randomItemName = itemsFiltered[itemsFiltered.length * Math.random() | 0].properties.defaultPreset.shortName.replace(/\sStandard|\sDefault/g, '')

    return res.send(randomItemName)
  }catch(e){
    console.error(e)
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} from tarkov.dev`)
  }
})

// MAIN
const settings = {
  'maps': ['Labs', 'Customs', 'Shoreline', 'Factory', 'Lighthouse', 'Interchange', 'Reserve', 'Woods', 'Streets'],
  'games': ['tarkov', 'DAYZ', 'hunt:showdown', 'battlebit', 'Dark and Darker']
}

// utility
function rollArr(arr) {
  return arr[Math.floor(Math.random() * arr.length )]
}

// receive interactions
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  // filter for slash commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {

    // Random map generator
    if(interaction.data.name == 'map'){

      let map = '';

      if(interaction.data.options[0].name == 'includelabs') {
        map = rollArr(settings.maps);
      }
      
      if(interaction.data.options[0].name == 'excludelabs') {
        map = rollArr(settings.maps.slice(1));
      }

      const time = ['(AM)', '(PM)'];

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Have fun on **${map} ${time[time.length * Math.random() | 0]}**!`,
        },
      });
    }

    // Random game generator
    if(interaction.data.name == 'game'){
	let game = rollArr(settings.games);
	    
    	return res.send({
	    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
	    data: {
	      content: `Sir, the game of my choice is **${game}**, Sir!`
	    },
	});
    }

    // SCAV or PMC generator
    if(interaction.data.name == 'scavorpmc') {
      const scavORpmc = ['SCAV', 'PMC'];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You're about to play as **${scavORpmc[scavORpmc.length * Math.random() | 0]}**!`,
        },
      });
    }
    
    // Roulette
    if(interaction.data.name == 'roulette'){

      // send waiting status..
      try{
        let res = await discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`,{
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        })
      }catch(e){
        console.log(e)
      }

      // query tarkov.dev weapon info
      let query = { 
        "operationName": "",
        "query": `query { items(type: gun) { properties { __typename ... on ItemPropertiesWeapon { defaultPreset { shortName gridImageLink }}}} }`,
        "variables": {}
      }
      
      
      let helmetArg = (interaction.data.options) ? interaction.data.options[0].value : '1-4',
          armorArg = (interaction.data.options) ? interaction.data.options[1].value : '2-4';

      const lvlArr = ['1','2','3','4','5','6'],  
            helmetArr = ['cosmetic'], 
            armorArr = ['naked'];
      
      let availableHelmets = helmetArr.concat(lvlArr.filter((lvl) => { return lvl.match(new RegExp(`\[${helmetArg}]`, 'g')) })),
          availableArmor = armorArr.concat(lvlArr.slice(1, 6).filter((lvl) => { return lvl.match(new RegExp(`\[${armorArg}]`, 'g')) })),
          randomHelmet = availableHelmets[availableHelmets.length * Math.random() | 0],
          randomArmor = availableArmor[availableArmor.length * Math.random() | 0];

      function headphones() {
        if(randomHelmet == '2' || randomHelmet == '5' || randomHelmet == '6') {
          return 'blocked by headgear'
        } else {
          let yesno = ['yes', 'no']
          return yesno[yesno.length * Math.random() | 0]
        }
      }

      try
      {
        // send graphQl query to tarkov.dev
        let tarkovDevResponse = await tarkovDev.post('/graphql', query)
        let items = tarkovDevResponse.data.data.items
    
        // exclude items without defaultPreset
        let itemsFiltered = items.filter((item) => { return item.properties.defaultPreset != null })
        let randomItem = itemsFiltered[itemsFiltered.length * Math.random() | 0].properties.defaultPreset 

        let rouletteEmbed = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          embeds: [
            {
              "type": "rich",
              "title": `Your Roll`,
              "description": `use it or get recked!`,
              "color": 0x00FFFF,
              "fields": [
                {
                  "name": `Weapon`,
                  "value": `${randomItem.shortName.replace(/\sStandard|\sDefault/g, '')}`,
                  "inline": true
                },
                {
                  "name": `Armor`,
                  "value": `Lvl: ${randomArmor}`,
                  "inline": true
                },
                {
                  "name": `Helmet`,
                  "value": `Lvl: ${randomHelmet}`,
                  "inline": true
                },
                {
                  "name": `Headphones`,
                  "value": `${headphones()}`,
                  "inline": true
                }
              ],
              "image": {
                "url": `${randomItem.gridImageLink}`,
                "height": 0,
                "width": 0
              }
            }
          ]
        }
        
        try{
          let res = await discord_api.patch(`/webhooks/${APPLICATION_ID}/${interaction.token}/messages/@original`, rouletteEmbed)
        }catch(e){
          console.log(e)
        }

        return res.send({type: 1}); // pong
        
      } catch(e){
          console.error(e)
          console.error(e.code)
          console.error(e.response?.data)
          return res.send(`${e.code} from tarkov.dev`)
        }
    }

    // Tarkov Extreme Challenges
    if(interaction.data.name == 'challenge'){
      const challengeChannelId = '1032017111767330816';
      let challenges = [];

      try{
        let res = await discord_api.get(`/channels/${challengeChannelId}/messages`)
        res.data.forEach(msg => {
          if(msg.content.includes(`\n`)){
            msg.content.split(`\n`).forEach(challenge => challenges.push(challenge))
          } else {
            challenges.push(msg.content);
          }
        })
        
      }catch(e){
        console.log(e)
      }

      let rolledChallenge = rollArr(challenges);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `${rolledChallenge}`
        }
      })
    }


    // TEST
    if(interaction.data.name == 'test'){
        return res.send({
          type: 9, // Modal
          data: {
            custom_id: 'gameRollSettings',
            title: 'List of Games..',
            components: [ 
              {
                "type": 1,
                "components": [
                      {
                        type: 4,
                        label: `List of Games`,
                        style: 	2,
                        custom_id: 'games_input'
                      }
                  ]
              }
          ]
          }
        })      
    }
  }

  // filter for MODAL_SUBMIT's..
  if(interaction.type === 5) {

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Settings saved.'
      }
    });

  }

});

/* TODO: 
  - create interaction response inside #kuschelecke & in a thread/seperate channel, for backup reaons.
  - tarkov extreme challenges
*/

app.get('/bulkdelete', async(req,res) => {
  try{
    let channelMessages = await discord_api.get(`/channels/${KUSCHELECKE}/messages?limit=100`)
    let filteredMessages = channelMessages.data.filter(msg => msg.interaction).map(msg => msg.id)

    if(filteredMessages.length >= 2) {
      let deletedMsg = await discord_api.post(`/channels/${KUSCHELECKE}/messages/bulk-delete`, { messages: filteredMessages })
      return res.send('OK, bulk deleted')
    } else if (filteredMessages.length == 1) {
      return res.send('Only one message to delete. Ignoring.')
    } else if (filteredMessages.length == 0) {
      return res.send('No messages to delete.')
    }
     
  }catch(e){
    console.log(e)
    return res.send('ERROR')
  }
})

app.get('/roles', async(req,res) => {
  
  // GET
  try{
    let roles = await discord_api.get(`/guilds/${GUILD_ID}/roles`) // kingofthehill-role-id: 1030927052964106250
    let members = await discord_api.get(`/guilds/${GUILD_ID}/members?limit=100`)
    let kothMembers = members.data.filter(member => member.roles.length && member.roles.includes('1030927052964106250'))
    //console.log(roles.data)
    //console.log(members)
    //console.log('koth members: ', kothMembers)
    
    // delete old koth message
    // father of god id 922139349603209267
    let channelMessages = await discord_api.get(`/channels/${KUSCHELECKE}/messages?limit=100`)
    let filteredMessage = channelMessages.data.filter(msg => msg.author.id === '922139349603209267' && !msg.interaction && msg.content.includes('KING'))

    if(filteredMessage.length) {
      let deletedMsg = await discord_api.delete(`/channels/${KUSCHELECKE}/messages/${filteredMessage[0].id}`)
    }
    
    // send new koth message
    let kothAnnouncement = await discord_api.post(`/channels/${KUSCHELECKE}/messages`, {
      content: '```ansi\n \u001b[1;40;31mKING\u3000\u001b[1;40;36mOF\u3000THE\u3000\u001b[1;40;31mHILL\n```' 
      + `\n <@${kothMembers[kothMembers.length * Math.random() | 0].user.id}>`
    })
    
    return res.send(`king of the hill: ${kothMembers[kothMembers.length * Math.random() | 0].user.username}`)
  }catch(e){
    console.log(e)
    return res.send('ERROR')
  }

})

// register interaction commands "/?"
app.get('/register_commands', async (req,res) =>{
  let slash_commands = [
    {
      'name': 'test',
      'description': 'just testing..'
    },
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
    },
    {
      'name': 'roulette',
      'description': 'don\'t do it! Default: Helmets 2-4 & Armor 2-4',
      'options': [
        {
          'name': 'helmets',
          'description': 'Helmet level 1-6',
          'type': 3,
          'required': false
        },
        {
          'name': 'armor',
          'description': 'Armor level 1-6',
          'type': 3,
          'required': false
        }
      ] 
    },
    {
      'name': 'challenge',
      'description': 'Tarkov EXTREME Challenges. Ain\'t no fun',
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
                    new ButtonBuilder().setLabel('Fr??hst??ck').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="breakfast"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('Brunch').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="brunch"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('MITTACH').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="lunch"]').attributes[0].nodeValue)
                );
                const rowB = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('DU SNACK').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="snack"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('Abend *').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="dinner"]').attributes[0].nodeValue),
                    new ButtonBuilder().setLabel('S????es!').setStyle(ButtonStyle.Link).setURL(doc.querySelector('[rel="dessert"]').attributes[0].nodeValue)
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
