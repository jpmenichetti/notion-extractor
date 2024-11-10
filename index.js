const { Client } = require("@notionhq/client")
const https = require('https');
const fs = require('fs');
require('dotenv').config()

const notion = new Client({
	auth: process.env.NOTION_KEY,
});

let actionsMap = {};
//actionsMap["paragraph"] = acumulateText;
actionsMap["image"] = downloadImage;

const noteLink = "https://www.notion.so/AW2-The-Lake-House-131b84eca3da81739174ea0ef4bf38a1?pvs=4"
let blockId;

//Text between the last "-" and the fist "?"
const idExtractor = /\-(?!.*\-)(.*)\?/g;
const regExResults = noteLink.matchAll(idExtractor);
if(regExResults){
	const match =regExResults.next().value;
	blockId = match[1];
	console.log("block Id found: "+blockId);
}else{
	console.log("No block Id found");
	return;
}

traverseBlock(blockId);

function traverseBlock(blockId) {
	const blocks = notion.blocks.children.list({
		block_id: blockId,
		page_size: 100,
	}).then(data => {
		for (var i = 0; i < data.results.length; i++) {
			const node = data.results[i]
			console.log(`type: ${node.type}, id: ${node.id}`);
			const nodeContext = {
				currentNode: node,
				parentBlock: blockId,
				sequence: i 
			}
			action = actionsMap[node.type];
			if(action){
				action(node.image, nodeContext);
			}else{
				console.log(`Skipping type ${node.type}`)
			}
		}
	});
}

function downloadImage(imageNode, nodeContext){
	console.log("Downloading from URL...");
	const dirName = `images-${nodeContext.parentBlock}`;
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName);
	}
	const destination = `${dirName}/img${nodeContext.sequence}_${nodeContext.currentNode.id}.png`;
	const file = fs.createWriteStream(destination);
	https.get(imageNode.file.url, (response) => {
		response.pipe(file);
		file.on('finish', () => {
			file.close(() => {
				console.log('File downloaded successfully');
			});
		});
	}).on('error', (err) => {
		fs.unlink(destination, () => {
			console.error('Error downloading file:', err);
		});
	});
}