const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test.txt')
const copyPath = path.join(__dirname, 'testing.txt')


const readStream = fs.createReadStream(filePath, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024
});

readStream.on('data', (chunk) => {
    console.log('Size of the chunk:', chunk.length);
});

readStream.on('end', () => {
    console.log('Finished reading file');
});

readStream.on('error', (err) => {
    console.error('Error:', err);
});




const writeStream = fs.createWriteStream(copyPath);

readStream.pipe(writeStream);

writeStream.on('finish', () => {
    console.log('Finish coping the file successfully');
});




fs.stat(filePath, (err, stats) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('File Metadata:');
    console.log('Size:', stats.size, 'bytes');
    console.log('Is File:', stats.isFile());
    console.log('Created At:', stats.birthtime);
    console.log('Last Modified:', stats.mtime);
});



fs.watch(filePath, (eventType, filename) => {
    if (filename) {
        console.log(`File ${filename} changed: ${eventType}`);
    }
});
