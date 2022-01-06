// Nanoid to create random file name
const {
    customAlphabet
} = require('nanoid')
const nanoid = customAlphabet('0123456789qwertyuioplkjhgfdsazxcvbnm', 5)

// Import required AWS SDK clients and commands for Node.js
const {
    S3Client,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");
// Signed URL we can send to frontend
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// load the .env file
require('dotenv').config();

// S3 Constants
const REGION = 'us-west-2';
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Creating the service object
const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY
    }
})

async function sendSignedUrl(req, res, next) {

    const ContentType = res.locals.contendType
    const originalFileName = res.locals.fileName;

    // Generate the file name
    const fileName = `sop/${nanoid()}/${originalFileName}`

    const BUCKET_PARAMS = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        ContentType,
        ACL: 'public-read'
    }

    try {
        // get putObjectCommand
        const command = new PutObjectCommand(BUCKET_PARAMS)
    
        // get signed URL
        const signedURL = await getSignedUrl(s3, command, {
            expiresIn: 5000
        })

        // make object
        const signedURLObject = {
            signedURL,
            dataURL: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`
        }

        // send to frontend
        res.status(200).json(signedURLObject)
    }
    catch(err) {
        console.log('Error creating presigned URL', err);
        res.status(500).send(err)
    }
 
}

module.exports = {
    sendSignedUrl
}