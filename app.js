/* Defining Constants */
const Telegraf = require('telegraf');
require("dotenv").config(); //enviroment 
const { Extra, Markup } = Telegraf
const bot = new Telegraf(process.env.BOT_TOKEN);
const axios = require('axios');
const express = require('express')
const expressApp = express();

const TotalConfirmedNumberURL = process.env.TotalConfirmedNumberURL;
const TotalConfirmedInWorldURL = process.env.TotalConfirmedInWorldURL;
const TotalRecoveredInWorldURL = process.env.TotalRecoveredInWorldURL;
const TotalDeadInWorldURL = process.env.TotalDeadInWorldURL;

let CountryNamesKeyboardTextArray = [];
let EachCountryData = [];
let TotalConfirmed;
let TotalDead;
let TotalRecovered;


const PORT = process.env.PORT || 5000;
const URL = process.env.HEROKU_URL;
// /* bot launching */

expressApp.use(bot.webhookCallback('/bot'));

bot.telegram.setWebhook(`${URL}/bot`);

expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

expressApp.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

/* Starting work with bot */
bot.start(async(ctx) => { 
	await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.message.chat.username}! This bot will get information about COVID-19 (2019-nCoV) Coronavirus confirmed cases  around the world.`);
	SendReportOptions(ctx);
});

bot.help((ctx) => ctx.reply('This bot will get information about COVID-19 (2019-nCoV) Coronavirus confirmed cases  around the world.'));

bot.command('options', (ctx) => {
  SendReportOptions(ctx);
})
bot.on("text",(ctx) => {
	SendReportOptions(ctx);
})
bot.action('Simple report', async (ctx,next) => {
	let promises = [axios.get(TotalConfirmedNumberURL), axios.get(TotalDeadInWorldURL), axios.get(TotalRecoveredInWorldURL)];
	
	await Promise.all(promises).then(function(returnedData){
		TotalConfirmed = returnedData[0].data.features[0].attributes.value;
		TotalDead = returnedData[1].data.features[0].attributes.value;
		TotalRecovered = returnedData[2].data.features[0].attributes.value;
		
		
	})
	return ctx.reply(`Total confirmed cases in world:\nConfirmed ✅: ${TotalConfirmed}\nDeaths ☠️: ${TotalDead}\nRecovered 💪: ${TotalRecovered}\n`, Extra.markdown()).then(()=> next());
	
})
bot.action('Extended report', (ctx,next) => {
	axios.get(TotalConfirmedInWorldURL).then(function(countries) {
		let AllCountriesData = countries.data.features;
		if(CountryNamesKeyboardTextArray.length === 0){
			for (Countries in AllCountriesData){
				let CountryData = AllCountriesData[Countries].attributes;
				CountryNamesKeyboardTextArray.push(Markup.callbackButton(`${CountryData['Country_Region']}`, `${CountryData['Country_Region']}`));
			}
			SendKeyboardArray(ctx);
		}
		SendKeyboardArray(ctx);
	}).then(() => next());
});

bot.action(/.+/, (ctx) => {
	console.log(ctx.match[0]);
	switch(ctx.match[0]) {
		case 'Simple report':
			ctx.answerCbQuery(`You chose ${ctx.match[0]}!`)
			break;
		case 'Extended report':
			ctx.answerCbQuery(`You chose ${ctx.match[0]}!`)
			break;
		default:
			let InfectedCountries = [];
			axios.get(TotalConfirmedInWorldURL).then(function(countries) {
				let AllCountriesData = countries.data.features;
				if(EachCountryData.length == 0){
					for (Countries in AllCountriesData){
						let CountryData = AllCountriesData[Countries].attributes;
						EachCountryData.push(
							{
								Country_Region: CountryData['Country_Region'],Confirmed: CountryData['Confirmed'],Deaths: CountryData['Deaths'],Recovered: CountryData['Recovered']
							}
						);
					}
				}
				//Finding pressed country in Object
				var result = EachCountryData.find(obj => {
					return obj.Country_Region === ctx.match[0];
				})
				ctx.reply(`Total confirmed cases in *${result.Country_Region}*:\nConfirmed ✅: ${result.Confirmed}\nDeaths ☠️: ${result.Deaths}\nRecovered 💪: ${result.Recovered}\n`, Extra.markdown());
			})
			ctx.answerCbQuery(`You chose ${ctx.match[0]}`)
	}	
})

const SendReportOptions = (ctx) => {
	return ctx.reply('Here are your options: ',
		Markup.inlineKeyboard([
		  Markup.callbackButton('Simple report', 'Simple report'),
		  Markup.callbackButton('Extended report', 'Extended report')
		]).extra()
  	)
}

const SendKeyboardArray = (ctx) => {
	return ctx.reply('Choose a country: ', Markup.inlineKeyboard(SplitKeyboard(CountryNamesKeyboardTextArray)).extra())	
}
const SplitKeyboard = (keyboard) => {
	const length = keyboard.length;
	// Last row can contain one element more.
	const maxElementsPerRow = 3;
	const numberOfRows = Math.ceil(length / maxElementsPerRow);
	const elementsPerRow = Math.round(length / numberOfRows);
	const result = [];
	for (let i = 0; i < numberOfRows; i++) {
		// Add remainder to last row
		const end = i === numberOfRows - 1 ? length : (i + 1) * elementsPerRow;
		const split = keyboard.slice(i * elementsPerRow, end);
		result.push(split);
	}
	return result;
}

bot.launch()