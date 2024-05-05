const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const { json } = require('express');

const apikey = 'API KEY HERE';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/checkHashes', async (req, res) => {
    const { hashes } = req.body;
    const analysisResults = [];

    try {
        const hashesArray = hashes.trim().split('\n');
        
        for (const hash of hashesArray) {
            const trimmedHash = hash.trim();

            // Determine hash type based on length
            let hashType;
            switch (trimmedHash.length) {
                case 32:
                    hashType = 'MD5';
                    break;
                case 40:
                    hashType = 'SHA-1';
                    break;
                case 64:
                    hashType = 'SHA-256';
                    break;
                default:
                    hashType = 'Unknown';
            }

            // Check if the trimmedHash is an IP address
            if (isIPAddress(trimmedHash)) {
                console.log(`Skipped IP address: ${trimmedHash}`);
                continue; // Skip processing this line
            }

            // Introduce a 10-second delay before each API request
            await sleep(15000); // 10 seconds in milliseconds

            const response = await fetch(`https://www.virustotal.com/vtapi/v2/file/report?apikey=${apikey}&resource=${trimmedHash}`);
            const result = await response.json();

            if (result.positives !== 0) {
                analysisResults.push(`${trimmedHash} (${hashType}) - ${result.positives} engines detected it as malicious`);
            } else {
                analysisResults.push(`${trimmedHash} (${hashType}) - Clean`);
            }
        }

        res.json({ success: true, analysisResults });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ success: false, message: 'Error occurred while checking hashes' });
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to check if a string is an IP address
function isIPAddress(input) {
    // Regular expression to match IPv4 and IPv6 addresses
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
    return ipRegex.test(input);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
