var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({ keyFilename: "splitskies-adfav-8d49b96bba3c.json" });

app.use(express.static(__dirname + '/public'));

//Parses Google Cloud Vision result into individual words
function getWords(fullText, w, h) {
  var result = [];
  fullText.pages.forEach(pg => pg.blocks.forEach(b => b.paragraphs.forEach(p => p.words.forEach(function(word) {
    var tmpWord = { text: "", style: getStyle(word.boundingBox.vertices, w, h) };
    word.symbols.forEach(function(symbol) {
      tmpWord.text += symbol.text;
    });
    result.push(tmpWord);
  }))));
  result.sort( (a,b) => a.style.top - b.style.top);
  result = mergeBoxes(result);
  return result;
}

//Determines if two boxes are part of the same line item
//Currently, a little glitchy, not gonna lie.
function boxesIntersect(box, result) {
  var box_bottom = box.style.top + box.style.height;
  var result_bottom = result.style.top + result.style.height;
  if (box.style.top > result_bottom || box_bottom < result.style.top) { return false; }
  else if (box.style.top >= result.style.top && box_bottom <= result_bottom) { return true; }
  else if (result.style.top >= box.style.top && result_bottom <= box_bottom) { return true; }
  else if (box.style.top < result_bottom && result_bottom - box.style.top >= 1.00 * (box.style.height)) { return true; }
  else if (box_bottom > result.style.top && box_bottom - result.style.top >= 1.00 * (box.style.height)) { return true; }
  else return false;
}

/* REGULAR EXPRESSIONS ARE WEIRD 
 * /(\W|S)?\s*\d+\s*(\.|\,)?\s*\d\d\s*$/mg
 * 
 * (\W|S)?  - None or One non-word characters, or an S
 * \s*      - Any amount of whitespace
 * \d+      - 1 or more digits
 * \s*      - Any amount of whitespace
 * (\.|\,)? - One or maybe no periods or commas
 * \s*      - More whitespace
 * \d\d     - Two digits
 * \s*      - Even more whitespace
 * $        - End of line
 * /m       - Multi-line
 * g        - Global
 */


//Combines boxes that are (most likely) part of the same line item on a receipt
function mergeBoxes(boxes) {
  var results = [];
  //Starts by determining right and bottom edges of each line item
  boxes.forEach(function(box) {
    box.style.right = box.style.left + box.style.width;
    box.style.bottom = box.style.top + box.style.height;
    var found = false;
    results.forEach(function(result) {
      if (!found && boxesIntersect(box, result)) {
        //Combines boxes on same line
        found = true;
        result.words.push(box);
        result.style.left = Math.min(result.style.left, box.style.left);
        result.style.top = Math.min(result.style.top, box.style.top);
        result.style.right = Math.max(result.style.right, box.style.right);
        result.style.bottom = Math.max(result.style.bottom, box.style.bottom);
      }
    });
    if (!found) {
      //Create new line out of words that didn't match with anything else
      var result = { words: [box], style: {} };
      Object.keys(box.style).forEach(function(styleElem){
        result.style[styleElem] = box.style[styleElem];
      });
      results.push(result);
    }
  });

  results.forEach(function(result) {
    //Sort words from left to right, then combine words into single string
    result.words = result.words.sort((a, b) => a.style.left - b.style.left);
    result.text = result.words.reduce((a, b) => a + " " + b.text, "");
    
    //Split into text description and price
    var price = result.text.match(/(\W|S)?\s*\d+\s*(\.|\,)?\s*\d\d\s*$/mg);
    if(price){
      result.text = result.text.slice(0,result.text.indexOf(price[0]));
      result.price = processPrice(price[0]);
    } else{
      result.price = "";
    }
    
    //Standardize style into CSS style
    result.style.height = result.style.bottom - result.style.top;
    result.style.width = result.style.right - result.style.left;
    delete result.style.bottom;
    delete result.style.right;
    delete result.words;
    result = makePercentages(result);
  });
  return results;
}

//Turns price into standard looking price
function processPrice(price){
  console.log(price);
  price = price.replace(/\s*(\W|S)?\s*/,"");
  price = price.replace(/(\,|\.)/,".");
  console.log(price);
  return parseFloat(price);
}

//Converts raw style data from Cloud Vision into standard CSS parameters (without % signs)
function getStyle(boundingBox, w, h) {
  var result = {};
  result.left = 100 * parseFloat(boundingBox[0].x) / parseFloat(w);
  result.width = 100 * parseFloat(boundingBox[1].x - boundingBox[0].x) / parseFloat(w);
  result.top = 100 * parseFloat(boundingBox[0].y) / parseFloat(h);
  result.height = 100 * parseFloat(boundingBox[2].y - boundingBox[0].y) / parseFloat(h);
  return result;
}

//Sorting function that sorts boxes first in vertical order, then in horiztonal order
var topThenLeft = (a, b) => a.style.top == b.style.top ? a.style.left - b.style.left : a.style.top - b.style.top;

//Adds % signs to stylings 
function makePercentages(box) {
  box.style.left += "%";
  box.style.top += "%";
  box.style.width += "%";
  box.style.height += "%";
  return box;
}

app.post("/analyze", function(req, res) {
  console.log("img recieved");
  var receipt = req.body.img.split(";", 2)[1].slice(7);
  client
    .textDetection({ "image": { "content": receipt } })
    .then(function(results) {
      const fullTextAnnotation = results[0].fullTextAnnotation;
      if (results[0].error && results[0].error.message) {
        console.log(results[0].error.message.substr(0, 100) + " ...");
      }
      console.log("sending results");
      res.send(getWords(fullTextAnnotation, req.body.width, req.body.height));
    })
    .catch(function(err) {
      console.error('ERROR:', err);
    });
});


app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

console.log("Splitskies v 1.0.0 - Up and Running");
app.listen(process.env.PORT || 8080);

exports = module.exports = app;