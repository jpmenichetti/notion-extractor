const { Client } = require("@notionhq/client")
const https = require('https');
const fs = require('fs');
require('dotenv').config()

const notion = new Client({
	auth: process.env.NOTION_KEY,
});

//const blockId = '7f279625baaa4805b920ab70e4bacf07';
const blockId = '560911c8fa55461d822a916e9711131d';
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
			//if(node.type == "paragraph"){
			//	let paragraph = node.paragraph;
			//	for (var j = 0; j < paragraph.rich_text.length; j++) {
			//		console.log(paragraph.rich_text[j].text.content);
			//	}
			//}
			if (node.type == "image") {
				downloadImage(node.image, nodeContext);
			}
			else {
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