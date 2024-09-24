const { Client } = require("@notionhq/client")
const https = require('https');
const fs = require('fs');
require('dotenv').config()

const notion = new Client({
  auth: process.env.NOTION_KEY,
});

//const blockId = '7f279625baaa4805b920ab70e4bacf07';
const blockId = '560911c8fa55461d822a916e9711131d';

const blocks = notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  }).then(data=>{
	for (var i = 0; i < data.results.length; i++) {
		console.log(`type: ${data.results[i].type}, id: ${data.results[i].id}`);
		//if(data.results[i].type == "paragraph"){
		//	let paragraph = data.results[i].paragraph;
		//	for (var j = 0; j < paragraph.rich_text.length; j++) {
		//		console.log(paragraph.rich_text[j].text.content);
		//	}
		//}
		if(data.results[i].type == "image"){
			let image = data.results[i].image;
			console.log("Downloading from URL...");
			//console.log(image.file.url);
			const destination = `images/${data.results[i].id}.png`;
			const file = fs.createWriteStream(destination);
			https.get(image.file.url, (response) => {
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
		else
		{
			console.log(`Skipping type ${data.results[i].type}`)
		}
	}
  });
