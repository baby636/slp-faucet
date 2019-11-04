import * as dotenv from 'dotenv';
dotenv.config();

import * as express from 'express';
import * as bodyParser from 'body-parser';
const app = express();

import * as slpjs from 'slpjs';
import { SlpFaucetHandler } from './slpfaucet';
import BigNumber from 'bignumber.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let slpFaucet = new SlpFaucetHandler(process.env.MNEMONIC!);
const faucetQty = parseInt(process.env.TOKENQTY!);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// If we are using a proxy, uncommenting the below line allows the app to get the real IP through the proxy and is necessary for limiting req by IP
// app.set('trust proxy', true);

// Initialize user array outside of get / post
let users = new Array();

// adding clear function for our IP list
function clearFunc() {
	console.log('clearing the users array, its been 12 hours');
	users = [];
}
// set interval to run clearFunc every 12 hours in milliseconds
setInterval(clearFunc, 43200000);

app.get('/', function (req, res) {
	res.render('index', { txid: null, error: null });
})

app.post('/', async function (req, res) {
	
	// Grab and print date/time and IP of user upon form submission/post
	let submitDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

	console.log('IP', req.ip);
	console.log('DATE', submitDate);


	// first check if IP has submitted in the last 12 hours and return an error if so
	let userIP = req.ip;

	// Next see if that user has already submitted within the last 24 hours
	try {
		if(users.indexOf(userIP) != -1) {
		// user already exists in array, send back error and return
		console.log('User already submitted form in last 12 hours, sending back error message');
			res.render('index', { txid: null, error: "You may only claim SOUR from the faucet once per 12 hours. Check back soon!"});
		return;
			}
	}
	catch(error) {
		console.log(error);
		return;
    	}

	// We checked the IP and its good, resume.

	let address = req.body.address;

	if(address === process.env.DISTRIBUTE_SECRET!) {
		res.render('index', { txid: null, error: "Token distribution instantiated, please wait 30 seconds..." });

		await slpFaucet.evenlyDistributeTokens(process.env.TOKENID!);
		await sleep(5000);
		await slpFaucet.evenlyDistributeBch();
		slpFaucet.currentFaucetAddressIndex = 0;
		return;
	}

	try {
		if(!slpjs.Utils.isSlpAddress(address)) {
			res.render('index', { txid: null, error: "Not a SLP Address." });
			return;
		}
	} catch(error) {
		res.render('index', { txid: null, error: "Not a SLP Address." });
		return;
	}

	let changeAddr: { address: string, balance: slpjs.SlpBalancesResult };
	try {
		changeAddr = await slpFaucet.selectFaucetAddressForTokens(process.env.TOKENID!);
	} catch(error) {
		res.render('index', { txid: null, error: "Faucet is temporarily empty :(" });
		return;
	}
	
	let sendTxId: string;
	try {
		let inputs: slpjs.SlpAddressUtxoResult[] = [];
		inputs = inputs.concat(changeAddr.balance.slpTokenUtxos[process.env.TOKENID!]).concat(changeAddr.balance.nonSlpUtxos)
		inputs.map(i => i.wif = slpFaucet.wifs[changeAddr.address]);
		sendTxId = await slpFaucet.network.simpleTokenSend(process.env.TOKENID!, new BigNumber(faucetQty), inputs, address, changeAddr.address);
	} catch(error) {
		console.log(error);
		res.render('index', { txid: null, error: "Server error." });
		return;
	}
	console.log(sendTxId);
	let re = /^([A-Fa-f0-9]{2}){32,32}$/;
	if (typeof sendTxId !== 'string' || !re.test(sendTxId)) {
		res.render('index', { txid: null, error: sendTxId });
		return;
	}

	// tx was successful and  user IP doesn't exist in the array yet so let's add them
    console.log('adding new user to array');
    users.push(userIP);
    // print all users IPs as we add them
    console.log('printing all users IPs:');
	console.log(users);

	res.render('index', { txid: sendTxId, error: null });
})

app.listen(process.env.PORT, function () {
	console.log('SLP faucet server listening on port '+process.env.PORT+'!')
})