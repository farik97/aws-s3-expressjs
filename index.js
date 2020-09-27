const app = require('express')()
const multer = require('multer')
const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const stream = require('stream')

require('dotenv/config')

app.listen('4050')

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    destination: (req, file, callback) =>{
        callback(null, '')
    }
})

const upload = multer({storage: storage}).single('image')

app.post('/upload', upload, (req, res)=>{

    let myImage = req.file.originalname.split('.')
    const fileType = myImage[myImage.length-1]
    
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuid()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (error, data)=>{
        if (!error) {
            res.status(200).send(data)
        } else {
            res.status(400).send(error)
        }
    })
      
})


app.get('/image/:filename', (req, res) => {
    const downloadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.params.filename
    }
    s3.getObject(downloadParams)
        .createReadStream()
        .on('error', (err)=>{
            res.status(500).json({error: "Error -> " +err})
        }).pipe(res).write
})