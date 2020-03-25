import * as dotenv from 'dotenv';
dotenv.config();
const express = require('express');
//import * as express from 'express';
import * as bodyParser from 'body-parser';
const app = express();

import * as slpjs from 'slpjs';
import { SlpFaucetHandler } from './slpfaucet';
import BigNumber from 'bignumber.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let slpFaucet = new SlpFaucetHandler(process.env.MNEMONIC!);
const faucetQty = parseInt(process.env.TOKENQTY!);


let users = new Array();
let spamArray = new Array();
let addressArray = new Array();
let spamAddresses = new Array();

function clearFunc() {
	console.log('clearing the users and address arrays, its been 12 hours');
	users = [];
	addressArray = [];

}


//setInterval(clearCookies, 5000);
// 43200000
// interval to run clearFunc every 12 hours in milliseconds
setInterval(clearFunc, 43200000);


function clearDistributedAmnt(){
	totalDistAmnt = Number(0);
}

// interval to run clearFunc every 2 hours in milliseconds
setInterval(clearDistributedAmnt, 7200000);

function removeFromArray(userIP, address){
			//error, remove userIP & address from arrays.
          const indexIP = users.indexOf(userIP);
          const indexAd = addressArray.indexOf(address);
          if (indexIP > -1) {
            users.splice(indexIP, 1);
          }
          if (indexAd > -1) {
          	addressArray.splice(indexAd, 1);
          }
}

let totalDistAmnt = Number(0); 

function addDistAmnt(amount) {

	totalDistAmnt = totalDistAmnt + amount;
	console.log('Just added ' + amount + ' to Total. The total distributed amount in last 2 hours is now ' + totalDistAmnt);

	return totalDistAmnt;
	

}


let errorMsg = 'You may only claim from the faucet once per 12 hours. Check back soon!';

//permanently block spam users on each restart
//spamArray.push('176.113.74.202');
//spamArray.push('185.65.134.165');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//csurf cookie thangs
//var csrf = require('csurf')
const cookieParser = require('cookie-parser');
//var csrfProtection = csrf({ cookie: true })

// const csrfMiddleware = csurf({
//   cookie: true
// });

//JSON object to be added to cookie 
const sour_cookie = 'dacookie-623$^2345234sadnfdKNFDSL:k3h48942000000'

app.use(cookieParser());
//app.use(csrfMiddleware);

let captcha = { 
	0 : 'What is 2 + two?',
	1 : 'What is four + 4?',
	2 : 'What is 4 + five?',
	3 : 'What is five + 8?',
	4 : 'what is nineteen minus 9?',
}

//get request from user, return index page with null vals & captcha
app.get('/', function (req, res) {
	// generate random index for captcha questions
	let index = Math.round(Math.random() * 10);
	if (index > 5){
		index = index - 5;
	}


	res.render('index', { txid: null, error: null, randomNumber: null, captcha: captcha[index]});
})

// cookie testing

//, csrfToken: req.csrfToken()
//req.body.csrfToken()
//req.body._csrf

// app.get('/cookie', function (req, res) {
// 	console.log('COOKIES: ', req.cookies);
// 	res.send(req.cookies);
// })

// app.get('/add', function (req, res) {
// 	res.cookie('SOUR_Faucet', sour_cookie, { maxAge: 5000, httpOnly: true });
// 	res.send('SOUR cookie added');
// 	//var expiryDate = new Date(Number(new Date()) + 10000); 
// })

// REMOVE! 
// app.get('/clearcookies', function (req, res) {
// 	res.clearCookie('SOUR_Faucet');
// 	res.send('SOUR cookie removed');
// })


app.post('/', async function (req, res) {

	let index = Math.round(Math.random() * 10);
	if (index > 5){
		index = index - 5;
	}

	let honeypot = req.body.honeypot;

	const isSpamSubmission = honeypot === undefined 
        || honeypot.length;

    // Grab and print date/time and IP of user upon form submission/post
	let submitDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	let userIP = req.ip;
	userIP  = userIP.substring(7, userIP.length);
	let userIPsub  = userIP.substring(0, 8);
	let address = req.body.address.trim();

	console.log('-----------------------------------------------------------------------------------');
	console.log('IP', userIP);
	console.log('DATE', submitDate);
	console.log('SUBMISSION: ', address);
	console.log('honeypot ', honeypot);
	
	if (isSpamSubmission) {
			console.log('ITS A BOT - DENY & GIVE GENERIC ERROR');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
	}

	let captchaQuestion = req.body.captchaQuestion;
	let captchaAnswer = req.body.captcha.trim().toUpperCase();

	console.log('captchaQuestion', captchaQuestion);
	console.log('captchaAnswer', captchaAnswer);

	if(captchaAnswer){

	switch(captchaQuestion) {
  		case captcha[0]:
  		if ( (captchaAnswer !== '4') && (captchaAnswer !== 'FOUR') ){
			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
  		}
    // code block
    	break;

    	case captcha[1]:
  		if ( (captchaAnswer !== '8') && (captchaAnswer !== 'EIGHT') ){
			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
  		}
    // code block
    	break;
  		
  		case captcha[2]:
    	// code block
    	 if ( (captchaAnswer !== '9') && (captchaAnswer !== 'NINE') ){
			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
  		 }
    	break;
  		
  		case captcha[3]:
  		 if ( (captchaAnswer !== '13') && (captchaAnswer !== 'THIRTEEN') ){
			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
  		 }
  		 break;

  		case captcha[4]:
  		  if ( (captchaAnswer !== '10') && (captchaAnswer !== 'TEN') ){
			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
  		}
  		break;

  		default:
  			console.log('incorrect captcha');
			res.render('index', { txid: null, error: 'Captcha is incorrect. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
			return;
	}

	}else{
		console.log('blank captcha');
		res.render('index', { txid: null, error: 'Captcha is blank. Check it and resubmit', randomNumber: null, captcha: captcha[index]});
		return;
	}

	// COOKIES !
	let reqCookies = [];

	if(req.cookies['SOUR_Faucet']){
		console.log('SOUR_Faucet COOKIES FOUND. THROWING ERROR.', req.cookies['SOUR_Faucet']);
		res.render('index', { txid: null, error: errorMsg, randomNumber: null, captcha: captcha[index]});
		return;
	}


	if ( (spamArray.indexOf(userIP) != -1) ) {
			console.log('User is SPAMMER ADDRESS, sending back error message');
			res.render('index', { txid: null, error: errorMsg, randomNumber: null, captcha: captcha[index]});
			return;
		}

	if (spamAddresses.indexOf(address) != -1) {
			console.log('User is using SPAM ADDRESS, sending back error message ;)');
			res.render('index', { txid: null, error: errorMsg, randomNumber: null, captcha: captcha[index]});
			return;
		}


		// USER IP ARRAY
	if(users.indexOf(userIP) != -1) {
		console.log('User IP already submitted form in last 12 hours, sending back error message');
		res.render('index', { txid: null, error: errorMsg, randomNumber: null, captcha: captcha[index]});
		return;
	}else{
		users.push(userIP);
	}


	// ADDRESS ARRAY
	if(addressArray.indexOf(address) != -1){
		console.log('User is submitting with an address that has already been used in the last 12 hours.');
        res.render('index', { txid: null, error: errorMsg, randomNumber: null, captcha: captcha[index]});
        return;
	}else{
		addressArray.push(address);
	}

	if ( address.length < 55 ){
		removeFromArray(userIP, address);
		res.render('index', { txid: null, error: 'Please enter your SLP address with the simpleledger: prefix', randomNumber: null, captcha: captcha[index] });
		return;
	}

	if (totalDistAmnt > 250){
		console.log('totalAmntDistributed MAX for the last 2 hours has been reached at ' + totalDistAmnt);
		removeFromArray(userIP, address);
		res.render('index', { txid: null, error: 'Faucet is temporarily empty :(', randomNumber: null, captcha: captcha[index] });
		return;
	}

	if(address === process.env.DISTRIBUTE_SECRET!) {
		res.render('index', { txid: null, error: "Token distribution instantiated, please wait 30 seconds..." , randomNumber: null, captcha: captcha[index] });

		await slpFaucet.evenlyDistributeTokens(process.env.TOKENID!);
		await sleep(5000);
		await slpFaucet.evenlyDistributeBch();
		slpFaucet.currentFaucetAddressIndex = 0;
		return;
	}

	try {
		if(!slpjs.Utils.isSlpAddress(address)) {
			//error, remove userIP & address from arrays.
			//console.log(users);
			//console.log(addressArray);
			removeFromArray(userIP, address);
			//console.log(users);
			//console.log(addressArray);
			res.render('index', { txid: null, error: "Not a SLP Address.", randomNumber: null, captcha: captcha[index] });
			return;
		}
	} catch(error) {
		//error, remove userIP & address from arrays.
          removeFromArray(userIP, address);
		res.render('index', { txid: null, error: "Not a SLP Address.", randomNumber: null, captcha: captcha[index] });
		return;
	}

	let changeAddr: { address: string, balance: slpjs.SlpBalancesResult };
	try {
		changeAddr = await slpFaucet.selectFaucetAddressForTokens(process.env.TOKENID!);
	} catch(error) {
		//error, remove userIP & address from arrays.
          removeFromArray(userIP, address);

		res.render('index', { txid: null, error: "Faucet is temporarily empty :(", randomNumber: null, captcha: captcha[index] });
		return;
	}

	// generate random number for amount to give to each user
	// this will generate a number between 0 & 99
	let random = Math.random() * 100;
	//console.log(random);
	
	// MAX STARTED AT 100. If over 50, lets subtract 50 (remove this if you want it to be up to 99)
	if(random > 50){
		random = random - 50;
	}
	
	//console.log(random);
	
	// convert to satoshis for faucet
	let tokenQty = Math.round(random * 100000000);
	//fix decimals
	let randomNum = random.toFixed(8);
	//console.log(tokenQty);
	//convert to string
	const faucetQty = String(tokenQty);
	console.log('RANDOM NUMBER', randomNum);


	let sendTxId: string;
	try {
		let inputs: slpjs.SlpAddressUtxoResult[] = [];
		inputs = inputs.concat(changeAddr.balance.slpTokenUtxos[process.env.TOKENID!]).concat(changeAddr.balance.nonSlpUtxos)
		inputs.map(i => i.wif = slpFaucet.wifs[changeAddr.address]);
		sendTxId = await slpFaucet.network.simpleTokenSend(process.env.TOKENID!, new BigNumber(faucetQty), inputs, address, changeAddr.address);
	} catch(error) {
		//error, remove userIP & address from arrays.
          removeFromArray(userIP, address);

		console.log(error);
		res.render('index', { txid: null, error: "Server error.", randomNumber: null, captcha: captcha[index]});
		return;
	}
	console.log(sendTxId);
	let re = /^([A-Fa-f0-9]{2}){32,32}$/;
	if (typeof sendTxId !== 'string' || !re.test(sendTxId)) {
		//error, remove userIP & address from arrays.
          removeFromArray(userIP, address);

		res.render('index', { txid: null, error: sendTxId, randomNumber: null, captcha: captcha[index]});
		return;
	}

    //add amount to total and above we deny if max is reached.
    //console.log(parseFloat(randomNum));
   	addDistAmnt(parseFloat(randomNum));

	// print all users IPs as we add them to arrays
    console.log('printing all users IPs & addresses submitted in last 12 hours:');
	console.log(users);
	console.log(addressArray);

	//add cookie for 12 hours. 
	res.cookie('SOUR_Faucet', sour_cookie, { maxAge: 43200000, httpOnly: true });
	res.render('index', { txid: sendTxId, error: null, randomNumber: randomNum});

	
})

app.listen(process.env.PORT, function () {
	console.log('SLP faucet server listening on port '+process.env.PORT+'!')
})