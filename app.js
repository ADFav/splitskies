// /**
// * TODO(developer): Uncomment the following line before running the sample.
// */
// // const fileName = 'Local image file, e.g. /path/to/image.png';

// // Performs text detection on the local file
// const fileName = "../Test Images/A.jpg";
// client
//   .documentTextDetection(fileName)
//   .then(results => {
//     const fullTextAnnotation = results[0].fullTextAnnotation;
//     console.log(fullTextAnnotation.text);
//   })
//   .catch(err => {
//     console.error('ERROR:', err);
//   });



var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

app.use(express.static(__dirname + '/public')); 

app.get("/blah",function(req,res){
  console.log("OO!");
  res.send("Testing");
});

app.post("/analyze", bodyParser.urlencoded({limit: '50mb',extended: true}), function(req,res){
  console.log("img recieved");
  var receipt = req.body.img.split(";",2)[1].slice(7);
  var receipt_obj = {"image":{"content": receipt}};
  client
  .textDetection(receipt_obj)
  .then(results => {
    const fullTextAnnotation = results[0].fullTextAnnotation;
    if(results[0].error && results[0].error.message){
      console.log(results[0].error.message.substr(0,100) + " ...")
    }
    console.log("sending results");
    res.send(results)
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
});


app.get("/",function(req,res){
  res.sendFile(__dirname + "/public/index.html");
});

console.log("Splitskies v 0.0.0 - Up and Running");
app.listen(process.env.PORT || 8080);

exports = module.exports = app;