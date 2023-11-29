const axios = require("axios");
const sharp = require('sharp');
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.use(bodyParser.json());
app.get('/get-results', async (req, res) => {
    if (!req.body.imgURL)
        return res.status(403).json({
            message: "Image URL is missing"
        });
    const imgURL = req.body.imgURL;
    try {
        const results = await getResults(imgURL);
        res.json(
            {
                message: 'Success',
                ...results
            }
        )
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
})

async function getImageArea(url) {
    try {
        const response = await axios({ url, responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        const area = metadata.width * metadata.height;
        return area;
    } catch (error) {
        throw (error)
    }
}


async function getResults(url) {
    try {
        const response = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/ragi-impurity-detection/1",
            params: {
                api_key: "ROn7MooXrlCS350XHYAF",
                image: url
            }
        });
        const predictions = response.data.predictions;

        try {
            const totalImageArea = await getImageArea(url);
            let sumAdjustedArea = 0;
            predictions.forEach(prediction => {
                const area = prediction.width * prediction.height;
                const adjustedArea = area * prediction.confidence;
                sumAdjustedArea += adjustedArea;
            });

            var qualityScore = ((totalImageArea - 5 * sumAdjustedArea) / totalImageArea) * 100;
            qualityScore = qualityScore < 0 ? 0 : qualityScore;
            const stoneCount = predictions.length;
            return { qualityScore, stoneCount }

        } catch (error) {
            throw (error)
        }
    }
    catch (e) {
        throw (e)
    }
}
