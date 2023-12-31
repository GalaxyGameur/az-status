const Discord = require("discord.js");
const fs = require("fs");
const toml = require("toml");
const { Category } = require("./app/Category");

if (!fs.existsSync("./configuration.toml")) {
    console.error("Configuration file not found !");
    process.exit(-1);
}

let configuration;
try {
    configuration = toml.parse(fs.readFileSync("./configuration.toml"));
} catch (err) {
    console.error(`Une erreur s'est produite lors du chargement de la configuration, merci de vérifier la syntaxe (${err})`);  
    process.exit(-1);
}

const client = new Discord.Client({ intents: 
    [ 
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
})
client.login(configuration.token).catch((err) => console.error(`Impossible de se connecter: ${err}`));

client.on("ready", () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
    const guild = client.guilds.cache.get(configuration.guild);

    if (guild == null) {
        console.error(`Impossible de trouver la guild ${configuration.guild}`);process.exit(-1);
    } else {
        console.log(`Guild trouvée ! (${guild.name})`);
    }
    const channel = guild.channels.cache.get(configuration.channel);
    
    if (channel == null) {
        console.error(`Impossible de trouver le salon ${channel}`);
        process.exit(-1);
    } else {
        console.log(`Salon trouvé ! (#${channel.name})`);
    }
    
    const categories = [];
    const status = configuration["status"];
    for (const categoryName in status) {
        const category = Category.parseFromConfig(status[categoryName]);
        categories.push(category);
    }
    
    client.status = {channel,categories,};
    setInterval(refresh, 120000);
});
    
async function refresh() {
    for (const category of client.status.categories) {
        for (const service of category.services) {
            await service.update();
        }
    }
    
    const format = getFormat();
    const { channel } = client.status;
    let message = channel.messages.cache.last();
    if (message == null) {
        channel.send({ embeds: [new Discord.MessageEmbed()
            .setColor(configuration.color_embed)
            .setDescription(`${format}`)
        ]});
        message = (await channel.messages.fetch()).last();
    } else {
        message.edit({ embeds: [new Discord.MessageEmbed()
            .setColor(configuration.color_embed)
            .setDescription(`${format}`)
        ]});
    }
}

function getFormat() {
    return `${client.status.categories.map((category) => category.getFormat()).join("\n")}*Dernière actualisation le ${new Date().toLocaleDateString("fr-fr", {hour: "2-digit",minute: "2-digit",second: "2-digit",})}*`;
}