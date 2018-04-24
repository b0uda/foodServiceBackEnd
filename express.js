const express = require('express')
const app = express()
var fs = require("fs");
const fileUpload = require('express-fileupload');

var path = require("path");
var multiparty = require('multiparty');

var _ = require('underscore-node');

var bodyParser = require('body-parser')


var FormData = require('form-data');

var MongoClient = require('mongodb').MongoClient;
var db_url = "mongodb://localhost:27017/";
var ObjectId = require('mongodb').ObjectID;

let foodList;



// for parsing application/json

var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})


// for parsing application/x-www-form-urlencoded
app.use(fileUpload({
  limits: {
    fileSize: 50 * 1024 * 1024
  },
}));


app.use("/public", express.static('public'));
app.use("/uploads", express.static('uploads'));


MongoClient.connect(db_url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("foodService");
  dbo.collection("foods").find({}).toArray(function (err, result) {
    if (err) throw err;
    foodList = result;
    db.close();
  });
});

app.set('view engine', 'pug')

app.get('/', (req, res) => res.send('Hello World!'))




// upload by USER

app.post('/upload', function (request, response) {

  var outDir = path.join(__dirname, "uploads");

  try {
    var Throttle = require("stream-throttle").Throttle;

    var fileName = request.headers["file-name"].replace(/ /g, '');

    console.log("filename : " + fileName);
    if (console) {
      console.log(request.method + "Request! Content-Length: " + request.headers["content-length"] + ", file-name: " + fileName);
      console.dir(request.headers);
    }
    let file = fileName.split(".");
    // var out = path.join(outDir, "upload-" + new Date().getTime() + "-" + fileName);
    var out = path.join(outDir, file[0] + "-" + new Date().getTime() + "." + file[1]);


    if (console) {
      console.log("Output in: " + out);
    }

    var total = request.headers["content-length"];
    var current = 0;

    var shouldFail = request.headers["should-fail"];

    // throttle write speed to 4MB/s
    request.pipe(new Throttle({
      rate: 1024 * 4096
    })).pipe(fs.createWriteStream(out, {
      flags: 'w',
      encoding: null,
      fd: null,
      mode: 0666
    }));

    request.on('data', function (chunk) {
      current += chunk.length;

      if (shouldFail && (current / total > 0.25)) {
        if (console) {
          console.log("Error ");
        }
        var body = "Denied!";
        response.writeHead(408, "Die!", {
          "Content-Type": "text/plain",
          "Content-Length": body.length,
          "Connection": "close"
        });
        response.write(body);
        response.end();
        shouldFail = false;
        if (console) {
          console.log("Terminated with error: [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
        }
      } else {
        if (console) {
          console.log("Data [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
        }
      }
    });

    request.on('end', function () {
      setTimeout(function () {
        if (console) {
          console.log("Done (" + out + ")");
        }
        var body = "Upload complete!";
        response.writeHead(200, "Done!", {
          "Content-Type": "text/plain",
          "Content-Length": body.length
        });
        response.write(body);
        response.end();
      }, 1000);
    });

    request.on('test', function () {
      console.log("cwejdwwew");
    });

    if (console) {
      request.on('error', function (e) {
        console.log('error!');
        console.log(e);
      });
    }
  } catch (e) {
    if (console) {
      console.log(e);
    }
    throw e;
  }
});

app.get("/getImage/:image", (req, res) => {
  console.log(req.params.image);


  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var id = req.params.image;

  console.log('id ' + id);

  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(id) !== -1) {
        pictureUrl.push(value);
      }
    });



    if (pictureUrl.length == 1 && pictureUrl[0].indexOf("-validated") != -1) {
      console.log("image validated");
      res.end(pictureUrl[0]);

    } else {
      console.log("image non validated");
      res.end("noimage");
    }

  });

});

// upload from ADMIN PANEL
app.post('/uploadAdmin/:foodId', function (req, res) {

  // console.log(req.params.foodId);


  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var url = req.params.foodId.replace(/ /g, '');

  console.log(`url : ${url}`);


  // Loop for images to get array of urls related to this food item
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(url[0]) !== -1) {
        pictureUrl.push(value);
      }
    });

    // Rename the image selected for validation 



    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.picture;
    let ext = sampleFile.name.split(".")[1];


    pictureUrl.forEach((_url) => {
      fs.unlink(`./uploads/${_url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${_url}`);
        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv(`./uploads/${url}-validated.${ext}`, function (err) {
          if (err)
            return res.status(500).send(err);

        });
      });

    });

    // let template = compiled({
    //   pics: pictureUrl,
    //   pic_name: id
    // });
    // res.end(template);

    res.end(`
    
    <style rel="stylesheet">
body{
  padding:0;
  margin:0;
  background: #00adf7;
}
div{
  background: #00adf7;
  height:100%;

}

h1{
  color:white;
  font-weight: bold;
  text-align:center;
  margin-top: 30px;
}

    .btn{
      color:##00adf7;
text-align: center;
padding: 20px;
      text-align: center;
cursor: pointer;
font-size:24px;
margin: 0 0 0 100px;
      border-radius: 4px;
background-color:#fff;
border: none;
padding: 20px;
width: 200px;
display: inline-block;
transition: all 0.5s;
margin-top:20px;
transition: all 1s;

    }

    .btn:hover{
      transform:scale(1.2);
    }
    </style>
    <div>
        <h1>Image uploaded by admin panel and other images deleted</h1>
        <a class="btn" href="http://localhost:3030/foodList">Back to List</a>
    </div>`);

  });




});



// list of pictures pending and validated


app.get("/listImage", (request, response) => {




  var compiled = _.template(`
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <style>
      div {
        width: 100%;
      }

      body{
        background:#00adf7;
        margin:0;
      }
       
      h2 {
        font: 400 40px/1.5 Helvetica, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        text-align:center;
        font-weight: bold;
        color:white;
        margin-bottom:20px;
      }
       
      ul.item-list {
        list-style-type: none;
        margin: 0;
        padding: 0;
       
      }
       
      ul.item-list li {
        font: 200 20px/1.5 Helvetica, Verdana, sans-serif;
        border-bottom: 1px solid #ccc;
        text-align:center;
        
      }
       
      ul.item-list  li:last-child {
        border: none;
      }
       
      ul.item-list  li a {
        text-decoration: none;
        color: #fff;
        display: block;
        width: 100%;
       
        -webkit-transition: font-size 0.3s ease, background-color 0.3s ease;
        -moz-transition: font-size 0.3s ease, background-color 0.3s ease;
        -o-transition: font-size 0.3s ease, background-color 0.3s ease;
        -ms-transition: font-size 0.3s ease, background-color 0.3s ease;
        transition: font-size 0.3s ease, background-color 0.3s ease;
      }
       
      ul.item-list  li a:hover {
        font-size: 30px;
        background: #f6f6f6;
        color:#00adf7;

      }

#link_ul{
  list-style: none;
  font-decoration:none;
}

#link_ul li{
display:inline-block;
width:30%;
border-bottom: none;

}

.item-list li:first-child{
  display:none;
}

li#index0{
  display:none;
}

      </style>
    </head>
    
    <body>
    <h1 style="color:white; text-align:center;">Food Service Images ADMIN PANEL</h1>
      <h1>
        <div>
          <h2 >
            Images Waiting
          </h2>
          <ul class="item-list">

        <div>
        <ol id="link_ul" style="text-align:center; color:white; border-bottom:2px white solid;">
        <li style="font-size:2rem;">id</li>
        <li style="font-size:2rem;">name of food</li>
        <li style="font-size:2rem;">place of food</li>
      </div>
        </li>

            <% for(var pic in picsNon) { %>
              <li id="index<%= pic %>" >
              <a href="http://localhost:3030/foodValidate/<%= picsNon[pic] %>/non">
                <ol id="link_ul">
                  <li><%= picsNon[pic].split("_")[0] %></li>
                  <li><%= picsNon[pic].split("_")[1] %></li>
                  <li><%= picsNon[pic].split("_")[2] %></li>
                </ol>
              </a>
              </li>
              <% } %>
          </ul>
        </div>
      </h1>



      <h1>
      <div>
        <h2 >
         Image Validated
        </h2>
        <ul class="item-list">

      <div>
      <ol id="link_ul" style="text-align:center; color:white; border-bottom:2px white solid;">
      <li style="font-size:2rem;">id</li>
      <li style="font-size:2rem;">name of food</li>
      <li style="font-size:2rem;">place of food</li>
    </div>
      </li>

          <% for(var pic in picsYes) { %>
            <li  >
            <a href="http://localhost:3030/foodValidate/<%= picsYes[pic] %>/yes">
              <ol id="link_ul">
                <li><%= picsYes[pic].split("_")[0] %></li>
                <li><%= picsYes[pic].split("_")[1] %></li>
                <li><%= picsYes[pic].split("_")[2] %></li>
              </ol>
            </a>
            </li>
            <% } %>
        </ul>
      </div>
    </h1>
    
    </body>`);


  // get the pictures in uploads folder and put them in list
  let _folder = "./uploads/";
  let picturesList = [];
  let pictureGroupsNonValidated = [];
  let pictureGroupsYesValidated = [];


  // pictures non-validated

  // loop over all images in uploads folder  
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      // pushh all the files
      picturesList.push(file);
    });
    picturesList.forEach(function (value) {
      // push only unique instances if not validated
      if (!_.contains(pictureGroupsNonValidated, value.split("-")[0]) && value.indexOf("-validated") == -1) {
        pictureGroupsNonValidated.push(value.split("-")[0]);
      }
    });

    // pictures validated
    picturesList.forEach(function (value) {
      // push only unique instances if not validated
      if (!_.contains(pictureGroupsYesValidated, value.split("-")[0]) && value.indexOf("-validated") != -1) {
        pictureGroupsYesValidated.push(value.split("-")[0]);
      }
    });




    let template = compiled({
      picsNon: pictureGroupsNonValidated,
      picsYes: pictureGroupsYesValidated
    });
    response.end(template);
  });




});


// get food Item MANAGEMENT

app.get("/foodValidate/:foodId/:validated", (req, res) => {



  var compiled = _.template(`
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <style>
      body {
        font: 13px/1.231 "Lucida Grande", Verdana, sans-serif;
        background-color: #00adfc;
        color: #111;
        margin: 0;
      }
      .site {
        /* width: 720px; */
        max-width: 55.38461538461538em;
        margin: 1.25em auto;
        padding: 3.6em;
        overflow: auto;
        background-color: #f5f5f5;
      }
      .wide {
        width: 100%;
      }
      /* Portfolio gallery */
      .gallery-portfolio img {
        max-width: 100% !important;
        display: block;
        border: none;
        padding: 0;
      }
      .gallery {
        overflow: auto;
        list-style: none;
      }
      .gallery-portfolio {
        margin: 2em auto 0;
        overflow: auto;
        list-style: none;
        padding: 0 !important;
      }
      .gallery-portfolio li,
      .gallery-portfolio li a {
        float: left;
        box-sizing: border-box;
      }
      .gallery-portfolio li {
        float: left;
        width: 29%;
        margin: 0 0.5% 3% 0;
        margin-left:3%;
        padding: 0px;
        background-color: #fff;
        border: 1px solid #e3e3e3;
        overflow:hidden;
      }
      .gallery-portfolio li:nth-child(3n+0) {
        margin-right: 0;
        /* outline: 2px dotted red; */
      }
      .gallery-portfolio li a {
        text-decoration: none;
        width: 100%;
        max-height: 126px;
        transition: outline .4s;
        outline: 5px solid transparent;
      }
  


      .gallery-portfolio li:nth-child(3n+1) {
        clear: left;
        /* outline: 3px solid green; */
      }
      /* images original size: width:400px, height: 225px
      images rendered size: width:224px, height: 126px
       */
      
      p {
        margin-bottom: 20px;
        margin-top: 0px;
      }
      /* ==========================================================
      Responsive-ness
      ============================================================= */
      /* Mobile (landscape)
      Note: Design for a width of 480px
      ------------------------------------------------------------- */
      @media only screen and ( min-width: 574px ) and ( max-width: 861px ) {
        .wide {
          /* width: auto; */
        } 
      }
      
      @media only screen and ( max-width: 574px ) {
        .gallery-portfolio  {
          overflow: hidden;
        }
        .gallery-portfolio li {
          width: 100%;
          max-width: 400px;
        }
        .gallery-portfolio li a {
          height: auto;
          max-height: inherit;
        }
      }

      .btn{
        color:#fff;
  text-align: center;
  padding: 20px;
        text-align: center;
  cursor: pointer;
  font-size:24px;
  margin: 0 0 0 100px;
        border-radius: 4px;
  background-color:#00adf7;
  border: none;
  padding: 20px;
  width: 200px;
  display: inline-block;
  transition: all 0.5s;
  margin-top:20px;
  
      }

      #btn_validate , #btn_delete{
        color:#fff;
        text-align: center;
        cursor: pointer;
        display: inline-block;
        transition: all 0.5s;
        width:50%;
      }

      #btn_validate:hover , #btn_delete:hover{
        outline-color:transparent;
        animation: btn_animate 1s linear;
       
      }

      @keyframes btn_animate{
        0%{ transform: rotate(0);}
        30%{ transform: rotate(-5deg);}
        60%{ transform: rotate(5deg);}
        0%{ transform: rotate(0);}
      }

      #btn_validate{
background: #4CAF50;
      }

      #btn_delete{
        background:#F44336;
      }

      .entry-title{
        color:#00adf7;
        font-weight:bold;
        text-align:center;
      }

      .food_item{
        transition: all .5s;
        width:20%;

      }

      .food_item:hover{
        transform: scale(1.1);
      }

      .site{
        padding:10px;
        width: 80%;
        max-width: 90%;
      }
      
      @media only screen and ( min-width: 862px ) {   }




      /* The Modal (background) */
      .modal {
          display: none; /* Hidden by default */
          position: fixed; /* Stay in place */
          z-index: 1; /* Sit on top */
          padding-top: 100px; /* Location of the box */
          left: 0;
          top: 0;
          width: 100%; /* Full width */
          height: 100%; /* Full height */
          overflow: auto; /* Enable scroll if needed */
          background-color: rgb(0,0,0); /* Fallback color */
          background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
      }
      
      /* Modal Content (image) */
      .modal-content {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
      }
      
      /* Caption of Modal Image */
      #caption {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
          text-align: center;
          color: #ccc;
          padding: 10px 0;
          height: 150px;
      }
      
      /* Add Animation */
      .modal-content, #caption {    
          -webkit-animation-name: zoom;
          -webkit-animation-duration: 0.6s;
          animation-name: zoom;
          animation-duration: 0.6s;
      }
      
      @-webkit-keyframes zoom {
          from {-webkit-transform:scale(0)} 
          to {-webkit-transform:scale(1)}
      }
      
      @keyframes zoom {
          from {transform:scale(0)} 
          to {transform:scale(1)}
      }
      
      /* The Close Button */
      .close {
          position: absolute;
          top: 15px;
          right: 35px;
          color: #f1f1f1;
          font-size: 40px;
          font-weight: bold;
          transition: 0.3s;
      }

      #img01{
        // width:500px;
        // height:500px;
      }

      .food_img{
        width:100%;
        height:230px;
      }

      .food_img_validated{
        width:80%;
        margin-left: 10%;
        height: 500px;
      }

      </style>
    </head>
    
    <body>
    <div class="site">
  <header class="entry-header wide">
    <h2 class="entry-title">Pictures Pending for <%= pic_name %></h2>
  </header>

  <div class="entry-content wide">

    
    <ul class="gallery-portfolio">


      <% if(validated == 'non') { %>

        <% for(var pic in pics) { %>
       
          <li  class="food_item" ><a href="#"><img alt="" class="food_img" src="http://localhost:3030/uploads/<%= pics[pic] %>"></a>
          
          <div class="food_actions">
          <a id="btn_validate" href="http://localhost:3030/validate/<%= pics[pic] %>">validate</a>
          <a id="btn_delete" href="http://localhost:3030/delete">Delete</a>
          </div>
          
          </li>
       
          <% } %>

        <% } %>



      <% if(validated == 'yes') { %>

        
       
        
        <a href="#"><img alt=""  class="food_img food_img_validated" src="http://localhost:3030/uploads/<%= pics[0] %>"></a>
       
        

        <% } %>

    
    </ul><!-- .gallery-portfolio -->

  </div><!-- .wide -->

  <% if(validated != 'new') { %>

  <form class="navigation" encType="multipart/form-data" method="post" action="http://localhost:3030/uploadAdmin/<%= pics[0].split("-")[0] %>">
  <a class="btn" href="http://localhost:3030/foodList">Back to List</a>
  <input class="btn" name="picture" type="file" />
  <input class="btn" type="submit" />
  </form>


  <% } %>

  <% if(validated == 'new') { %>

    <form class="navigation" encType="multipart/form-data" method="post" action="http://localhost:3030/uploadAdmin/<%= pics[0] %>">
    <a class="btn" href="http://localhost:3030/foodList">Back to List</a>
    <input class="btn" name="picture" type="file" />
    <input class="btn" type="submit" />
    </form>
  
  
    <% } %>

</div><!-- .site -->

<!-- The Modal -->
<div id="myModal" class="modal">
  <span class="close">&times;</span>
  <img class="modal-content" id="img01">
  <div id="caption"></div>
</div>



<script>
// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementsByClassName('food_img');
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");

console.dir(img);


for (i = 0; i < img.length; i++) {

  img[i].onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
}
}



// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() { 
    modal.style.display = "none";
}
</script>
    
    </body>`);


  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var id = req.params.foodId;
  var validated = req.params.validated;

  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(id) !== -1) {
        pictureUrl.push(value);
      }
    });

    // console.log(pictureGroups);

    let template = compiled({
      pics: pictureUrl,
      pic_name: id,
      validated: validated
    });
    res.end(template);
  });

});


// Validate A Picture

app.get("/validate/:foodId", (req, res) => {

  // need to validate one pictures and remove all others related to this food Item
  console.log("params : " + req.params.foodId);

  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var url = req.params.foodId.split("-");


  // Loop for images to get array of urls related to this food item
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(url[0]) !== -1) {
        pictureUrl.push(value);
      }
    });

    // Rename the image selected for validation 

    var ext = url[1].split(".")[1];

    fs.rename(`./uploads/${url[0]}-${url[1]}`, `./uploads/${url[0]}-validated.${ext}`, (err) => {
      if (err) throw err;
      console.log('Rename complete!');
    });

    // Delete all other pictures related to this food item
    var index = pictureUrl.indexOf(`${url[0]}-${url[1]}`);
    var deleted = pictureUrl.splice(index, 1);

    pictureUrl.forEach((url) => {
      fs.unlink(`./uploads/${url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${url}`);
      });

    });

    // let template = compiled({
    //   pics: pictureUrl,
    //   pic_name: id
    // });
    // res.end(template);

    res.end(`
    
    <style rel="stylesheet">
body{
  padding:0;
  margin:0;
  background: #00adf7;
}
div{
  background: #00adf7;
  height:100%;

}

h1{
  color:white;
  font-weight: bold;
  text-align:center;
  margin-top: 30px;
}

    .btn{
      color:##00adf7;
text-align: center;
padding: 20px;
      text-align: center;
cursor: pointer;
font-size:24px;
margin: 0 0 0 100px;
      border-radius: 4px;
background-color:#fff;
border: none;
padding: 20px;
width: 200px;
display: inline-block;
transition: all 0.5s;
margin-top:20px;
transition: all 1s;

    }

    .btn:hover{
      transform:scale(1.2);
    }
    </style>
    <div>
        <h1>Image Validated and others deleted</h1>
        <a class="btn" href="http://localhost:3030/foodList">Back to List</a>
    </div>`);

  });



});



// NON image part

// get all food
app.get('/allFood', function (req, res) {



  res.json(foodList);
})

// get food by id
app.get('/food/:id', function (req, res) {
  const id = req.params.id;

  let _food;

  foodList.forEach(food => {

    if (food.id == id) {
      _food = food;
    }
  });
  console.dir(_food);
  res.json(_food);
})

// get all food
app.get('/places', function (req, res) {
  // todo places need to get them with query

  const places = ["All", "mcdonalds", "Authentik", "Pizza Hut", "khalid", "Tacos de Lyon"];
  res.json(places);
})

// get food by budget
app.get('/budgetFood/:budget', function (req, res) {
  // todo mongodb

  const budget = req.params.budget;

  let foodListFiltred = [];

  foodList.forEach(food => {
    if (Number(food.price) <= Number(budget)) {
      foodListFiltred.push(food);
    }
  });



  res.json(foodListFiltred);
})

// filter food by category
app.get('/categoryFood/:budget/:category', function (req, res) {
  // todo mongodb

  const budget = req.params.budget;
  const category = req.params.category;

  console.log(`budget : ${budget} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    if (Number(food.price) <= Number(budget) && food.category === category) {
      foodListFiltred.push(food);
    }
  });



  res.json(foodListFiltred);
})

// filter food by place
app.get('/placeFood/:budget/:place', function (req, res) {
  // todo mongodb

  const budget = req.params.budget;
  const place = req.params.place;

  console.log(`budget : ${budget} && place: ${place}`);

  let foodListFiltred = [];
  console.log(place);
  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (Number(food.price) <= Number(budget) && food_place === place) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
})


// filter food by category and place
app.get('/categoryAndPlaceFood/:budget/:category/:place', function (req, res) {
  // todo mongodb

  const budget = req.params.budget;
  const place = req.params.place;
  const category = req.params.category;

  console.log(`budget : ${budget} && place: ${place} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (Number(food.price) <= Number(budget) && food_place === place && food.category === category) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
})


app.get("/foodList", (req, res) => {


  var compiled = _.template(`

  <html>
  <head>
    <script src="https://code.jquery.com/jquery-1.11.1.min.js"></script>

    <link href="//datatables.net/download/build/nightly/jquery.dataTables.css" rel="stylesheet" type="text/css" />
    <script src="//datatables.net/download/build/nightly/jquery.dataTables.js"></script>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.10/css/all.css" integrity="sha384-+d0P83n9kaQMCwj8F4RJB66tzIwOKmrdb46+porD/OvrJ+37WqIM7UoBtwHO6Nlg" crossorigin="anonymous">


    <style>
    // Table Styles

    // flexbox support for scroll-y
    
    @mixin dt-display-flex {
      display: -webkit-flex; // support for responsive scroll-y
      display: -ms-flexbox;
      display: flex;
    }
    @mixin dt-flex-11a {
      -webkit-flex: 1 1 auto;
      -ms-flex: 1 1 auto;
      flex: 1 1 auto;
    }
    @mixin dt-flex-100 {
      -webkit-flex: 1 0 0px;
      -ms-flex: 1 0 0px;
      flex: 1 0 0px;
    }
    @mixin dt-flex-vertical {
      -webkit-flex-flow: column nowrap;
      -ms-flex-flow: column nowrap;
      flex-flow: column nowrap;
    }
    
    // codepen example support
    html, body {
      height:100%;
      width: 100%;
      max-width: 100%;
      overflow-y: hidden;
    }
    
    // core layout
    
    .container {
      @include dt-display-flex;
      @include dt-flex-11a;
      height: 80%; // codepen - vary to see flex rule in action
      width: 60%;  // codepen - vary to see flex rule in action
      //  code rules to better identify container visually
      background-color: #f0f0f0;
      border: 1px solid blue;
      margin-top: 1rem;
      padding: 1rem;
    }
    
    .dataTables_wrapper {
      width: 100%;
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      -ms-overflow-style: -ms-autohiding-scrollbar;
      @include dt-display-flex;
      @include dt-flex-vertical;
      @include dt-flex-11a;
    }
    
    table.dataTable {
      background-color: #fff;
      width: 100%;
      margin: 0 auto;
      clear: both;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    // header
    
    table.dataTable thead,
    table.dataTable tfoot {
      background-color: #f5f5f5;
    }



    .dataTables_filter input{
      font-family: "Roboto", sans-serif;
    outline: 0;
    background: #f2f2f2;
    width: 100%;
    border: 0;
    margin: 0 0 15px;
    padding: 10px;
    box-sizing: border-box;
    font-size: 14px;
    }

    select{
      font-family: "Roboto", sans-serif;
      outline: 0;
      background: #f2f2f2;
      width: 100%;
      border: 0;
      margin: 0 0 15px;
      padding: 10px;
      box-sizing: border-box;
      font-size: 14px;
      height:30px;
    }

    #example_filter{
      color:white;
      margin-right:2%;
      width:25%;
    }

    #example_length{
      color:white;
    }
    
    table.dataTable thead th,
    table.dataTable tfoot th {
      font-weight: bold;

    }
    
    table.dataTable thead th:active,
    table.dataTable thead td:active {
      outline: none;
    }
    
    // rows
    
    table.dataTable tr.even,
    table.dataTable tr.alt,
    table.dataTable tr:nth-of-type(even) {
      background: #F9F9F9;
    }
    
    // compact toggle
    // table.dataTable.dt-compact th,
    // table.dataTable.dt-compact td {
    // font-size: .875rem;
    // padding: .5rem .625rem;
    // text-align: left;
    // white-space: nowrap;
    // }
    
    table.dataTable th,
    table.dataTable td {
      padding: 1rem;
      white-space: nowrap;
      text-align: left;
    }
    
    table.dataTable tfoot th,
    table.dataTable tfoot td {
      border:none;
    }
    
    // hover indicator(s)
    
    table.dataTable tbody > tr:hover {
      background-color: lightblue;
    }
    
    // scroll-x and scroll-y support
    // content-box rule is critical
    
    table.dataTable,
    table.dataTable th,
    table.dataTable td {
      -webkit-box-sizing: content-box;
      -moz-box-sizing: content-box;
      box-sizing: content-box;
    }
    .dataTables_wrapper .dataTables_scroll {
      clear: both;
      @include dt-display-flex;
      @include dt-flex-vertical;
      @include dt-flex-11a;
      // codepen rules to better identify scroll wrapper
      border: 1px solid #ccc;
      margin: 1.5rem 0
    }
    
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody {
      @include dt-flex-100;
      margin-top: -1px;
      -webkit-overflow-scrolling: touch;
    }
    
    // Fixes issue with Safari width calc. under rare conditions
    .dataTables_scrollHeadInner {
      flex: 1 1 auto;
    }
    
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody th > div.dataTables_sizing,
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody td > div.dataTables_sizing {
      height: 0;
      overflow: hidden;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .dataTables_wrapper:after {
      visibility: hidden;
      display: block;
      content: "";
      clear: both;
      height: 0;
    }
    
    // column sorting indicators
    
    table.dataTable thead .sorting_asc,
    table.dataTable thead .sorting_desc,
    table.dataTable thead .sorting {
      cursor: pointer;
    }
    table.dataTable thead .sorting {
      background: url("../img/datatables/sort_both.png") no-repeat center right;
      background: #00adf7;
      color:white;

    }

    table.dataTable tfoot {
      background: #00adf7;
      color:white;
    }

    table.dataTable thead .sorting_asc {
      background: url("../img/datatables/sort_asc.png") no-repeat center right;
      background: #4CAF50;
      color:white;
    }
    table.dataTable thead .sorting_desc {
      background: url("../img/datatables/sort_desc.png") no-repeat center right;
      background: red;
      color:white;
    }
    table.dataTable thead .sorting_asc_disabled {
      background: url("../img/datatables/sort_asc_disabled.png") no-repeat center right;
      background: purple;
    }
    table.dataTable thead .sorting_desc_disabled {
      background: url("../img/datatables/sort_desc_disabled.png") no-repeat center right;
      background: cyan;
    }

     

    h1{
text-align:center;
font-size:3rem;

    }
    .container{
      background:white;
      color:#00adf7;
      padding:10px;

    }
    body{
      background:#00adf7; 
    }
   
 
  

  #example{
    
  }



  .overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    transition: opacity 500ms;
    visibility: hidden;
    opacity: 0;
  }
  .overlay:target {
    visibility: visible;
    opacity: 1;
  }
  
  .popup {
    margin: 700px auto;
    padding: 20px;
    background: #fff;
    border-radius: 5px;
    width: 30%;
    position: relative;
    transition: all 5s ease-in-out;
    margin-top:100px;
  }
  
  .popup h2 {
    margin-top: 0;
    color: #00adf7;
    font-family: Tahoma, Arial, sans-serif;
  }
  .popup .close {
    position: absolute;
    top: 20px;
    right: 30px;
    transition: all 200ms;
    font-size: 30px;
    font-weight: bold;
    text-decoration: none;
    color: #333;
  }
  .popup .close:hover {
    color: #00adf7;
  }
  .popup .content {
    max-height: 30%;
    overflow: auto;
  }
  
  @media screen and (max-width: 700px){
    .box{
      width: 70%;
    }
    .popup{
      width: 70%;
    }
  }

  .button{
    width: 50px;
    height: 50px;
    background:#00adf7;
    display:inline-block;
    color:white;
    line-height:3rem;
    border:none;
    font-size:3rem;
    text-decoration:none;
    transition:all 1s;
    margin-left:50px;
  }

  .button:hover{
    transform: scale(1.1);
  }
  

  .form {
    position: relative;
    z-index: 1;
    background: #FFFFFF;
    max-width: 360px;
    margin: 0 auto 100px;
    padding: 45px;
    text-align: center;

  }
  .form input {
    font-family: "Roboto", sans-serif;
    outline: 0;
    background: #f2f2f2;
    width: 100%;
    border: 0;
    margin: 0 0 15px;
    padding: 15px;
    box-sizing: border-box;
    font-size: 14px;
  }
  .form button  {
    font-family: "Roboto", sans-serif;
    text-transform: uppercase;
    outline: 0;
    background: ;
    width: 100%;
    border: 0;
    padding: 15px;
    color: #FFFFFF;
    font-size: 14px;
    -webkit-transition: all 0.3 ease;
    transition: all 0.3 ease;
    cursor: pointer;
  }
  .form button:hover,.form button:active,.form button:focus {
    background: #00f3ff;
  }

  .fa-trash{
    float:right;
    color:red;
    cursor:pointer;
    transition:transform 1s;
  }

  .fa-trash:hover{
    transform:scale(1.2);
  }


  .item:hover{
    background: #00adf7;
    color:white;
  }

.item a{
  text-decoration:none;
}

    </style>
    <meta charset=utf-8 />
    <title>DataTables - JS Bin</title>
  </head>
  <body>
    <div class="container">
   <div class="box" style="text-align:center;">
   <h1 style=" display:inline-block;">List of Foods Json </h1>
    <a style="border-radius: 50%;" class="button " href="#popup1">+</a>
  </div>  
      <table id="example"
        datatable="" width="100%" cellspacing="0"
        data-page-length="33"
        data-scroll-x="true"
        scroll-collapse="false">
        <thead>
          <tr>
          <th>id</th>
          <th>place</th>
          <th>name</th>
          <th>category</th>
          <th>price</th>
          <th>Photo</th>
          </tr>
        </thead>

        <tfoot>
          <tr>
          <th>id</th>
          <th>place</th>
          <th>name</th>
          <th>category</th>
          <th>price</th>
          <th>Photo</th>
          </tr>
        </tfoot>

        <tbody>

        <% for(var food in foodList) { %>
          <tr class="item">
          <td><%= foodList[food].id %>         </td>
          <td><%= foodList[food].place %></td>
          <td><%= foodList[food].name %></td>
          <td><%= foodList[food].category %></td>
          <td><%= foodList[food].price %></td>
          <td><%= images[food].state %> <a href="http://localhost:3030/foodDelete/<%= foodList[food].id %>"><i class="fas fa-trash"></i></a>   </td>
        </tr>
        
          <% } %>
      
        
        
        </tbody>
      </table>
    </div>

    

<div id="popup1" class="overlay">
	<div class="popup form">
		<h2>Add new Food form</h2>
		<a class="close" href="#">&times;</a>
		 
    <form method="post" action="http://localhost:3030/foodAdd" class="login-form">
    <input name="name" type="text" placeholder="name"/>
    <input name="place" type="text" placeholder="place"/>

    <select style="width:100%; height: 50px; border:none; margin-bottom:5px;" name="category">
          <option>burger</option>
          <option>pizza</option>
          <option>tacos</option>
    </select>
    <input name="price" type="number" placeholder="price"/>
      <input style="background: #00adf7; color:white; " type="submit" value="Ajouter" />

  </form>	 
	</div>
</div>
    
    <script>
    $(document).ready( function () {
      var table = $('#example').DataTable();
    } );

   
    </script>
  </body>
</html>
  
  `);


  let foodImages = [];

  let picturesList = [];
  let _folder = "./uploads/";


  let picturesUrl = [];
  let pictureState = "";

  // update the foodList

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodService");
    dbo.collection("foods").find({}).toArray(function (err, result) {
      if (err) throw err;
      foodList = result;
      db.close();

      // get all files in List
      fs.readdir(_folder, (err, files) => {
        files.forEach(file => {
          picturesList.push(file);
        });
        // console.dir(picturesList);


        // for each food in the list search for images related to it
        foodList.forEach(food => {



          picturesList.forEach(function (value, index) {



            if (value.indexOf(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`) !== -1) {

              // console.log(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`);
              // console.log(value);
              picturesUrl.push(value);

            }
          });

          // console.log(food.id)
          // console.log(picturesUrl);

          // console.dir(picturesUrl);

          if (picturesUrl.length == 0) {
            pictureState = `<a href="http://localhost:3030/uploadNewImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}"><span style='color:red;'> no photo </span> </a>`;
            // console.log("no photo");
          } else if (picturesUrl.length == 1) {

            if (picturesUrl[0].indexOf("-validated") != -1) {
              // console.log("validated");
              pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/yes"><span style='color:green;'> validated <i class="fas fa-check"> </i> </span></a>`;
            } else {
              // console.log("1 pending");
              pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'> 1 pending <i class="far fa-clock"></i>  </span>   </a>     `;
            }

          } else {
            // console.log(`${picturesUrl.length} pending`);
            pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'>  ${picturesUrl.length} pending <i class="far fa-clock"> </i>  </span>  </a>    `;
          }

          // console.log("*********");

          // pictureimages is array of ids and pictures
          foodImages.push({
            id: food.id,
            images: picturesUrl,
            state: pictureState
          });

          picturesUrl = [];

        });

        // console.log(foodImages);

        let template = compiled({
          foodList: foodList,
          images: foodImages
        });

        res.end(template);

      });

    });
  });







})

app.get("/uploadNewImage/:url", (req, res) => {



  var compiled = _.template(`
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <style>
      body {
        font: 13px/1.231 "Lucida Grande", Verdana, sans-serif;
        background-color: #00adfc;
        color: #111;
        margin: 0;
      }
      .site {
        /* width: 720px; */
        max-width: 55.38461538461538em;
        margin: 1.25em auto;
        padding: 3.6em;
        overflow: auto;
        background-color: #f5f5f5;
      }
      .wide {
        width: 100%;
      }
      /* Portfolio gallery */
      .gallery-portfolio img {
        max-width: 100% !important;
        display: block;
        border: none;
        padding: 0;
      }
      .gallery {
        overflow: auto;
        list-style: none;
      }
      .gallery-portfolio {
        margin: 2em auto 0;
        overflow: auto;
        list-style: none;
        padding: 0 !important;
      }
      .gallery-portfolio li,
      .gallery-portfolio li a {
        float: left;
        box-sizing: border-box;
      }
      .gallery-portfolio li {
        float: left;
        width: 29%;
        margin: 0 0.5% 3% 0;
        margin-left:3%;
        padding: 0px;
        background-color: #fff;
        border: 1px solid #e3e3e3;
        overflow:hidden;
      }
      .gallery-portfolio li:nth-child(3n+0) {
        margin-right: 0;
        /* outline: 2px dotted red; */
      }
      .gallery-portfolio li a {
        text-decoration: none;
        width: 100%;
        max-height: 126px;
        transition: outline .4s;
        outline: 5px solid transparent;
      }
  


      .gallery-portfolio li:nth-child(3n+1) {
        clear: left;
        /* outline: 3px solid green; */
      }
      /* images original size: width:400px, height: 225px
      images rendered size: width:224px, height: 126px
       */
      
      p {
        margin-bottom: 20px;
        margin-top: 0px;
      }
      /* ==========================================================
      Responsive-ness
      ============================================================= */
      /* Mobile (landscape)
      Note: Design for a width of 480px
      ------------------------------------------------------------- */
      @media only screen and ( min-width: 574px ) and ( max-width: 861px ) {
        .wide {
          /* width: auto; */
        } 
      }
      
      @media only screen and ( max-width: 574px ) {
        .gallery-portfolio  {
          overflow: hidden;
        }
        .gallery-portfolio li {
          width: 100%;
          max-width: 400px;
        }
        .gallery-portfolio li a {
          height: auto;
          max-height: inherit;
        }
      }

      .btn{
        color:#fff;
  text-align: center;
  padding: 20px;
        text-align: center;
  cursor: pointer;
  font-size:24px;
  margin: 0 0 0 100px;
        border-radius: 4px;
  background-color:#00adf7;
  border: none;
  padding: 20px;
  width: 200px;
  display: inline-block;
  transition: all 0.5s;
  margin-top:20px;
  
      }

      #btn_validate , #btn_delete{
        color:#fff;
        text-align: center;
        cursor: pointer;
        display: inline-block;
        transition: all 0.5s;
        width:50%;
      }

      #btn_validate:hover , #btn_delete:hover{
        outline-color:transparent;
        animation: btn_animate 1s linear;
       
      }

      @keyframes btn_animate{
        0%{ transform: rotate(0);}
        30%{ transform: rotate(-5deg);}
        60%{ transform: rotate(5deg);}
        0%{ transform: rotate(0);}
      }

      #btn_validate{
background: #4CAF50;
      }

      #btn_delete{
        background:#F44336;
      }

      .entry-title{
        color:#00adf7;
        font-weight:bold;
        text-align:center;
      }

      .food_item{
        transition: all .5s;
        width:20%;

      }

      .food_item:hover{
        transform: scale(1.1);
      }

      .site{
        padding:10px;
        width: 80%;
        max-width: 90%;
      }
      
      @media only screen and ( min-width: 862px ) {   }




      /* The Modal (background) */
      .modal {
          display: none; /* Hidden by default */
          position: fixed; /* Stay in place */
          z-index: 1; /* Sit on top */
          padding-top: 100px; /* Location of the box */
          left: 0;
          top: 0;
          width: 100%; /* Full width */
          height: 100%; /* Full height */
          overflow: auto; /* Enable scroll if needed */
          background-color: rgb(0,0,0); /* Fallback color */
          background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
      }
      
      /* Modal Content (image) */
      .modal-content {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
      }
      
      /* Caption of Modal Image */
      #caption {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
          text-align: center;
          color: #ccc;
          padding: 10px 0;
          height: 150px;
      }
      
      /* Add Animation */
      .modal-content, #caption {    
          -webkit-animation-name: zoom;
          -webkit-animation-duration: 0.6s;
          animation-name: zoom;
          animation-duration: 0.6s;
      }
      
      @-webkit-keyframes zoom {
          from {-webkit-transform:scale(0)} 
          to {-webkit-transform:scale(1)}
      }
      
      @keyframes zoom {
          from {transform:scale(0)} 
          to {transform:scale(1)}
      }
      
      /* The Close Button */
      .close {
          position: absolute;
          top: 15px;
          right: 35px;
          color: #f1f1f1;
          font-size: 40px;
          font-weight: bold;
          transition: 0.3s;
      }

      #img01{
        // width:500px;
        // height:500px;
      }

      .food_img{
        width:100%;
        height:230px;
      }

      .food_img_validated{
        width:80%;
        margin-left: 10%;
        height: 500px;
      }

      </style>
    </head>
    
    <body>
    <div class="site">
  <header class="entry-header wide">
    <h2 class="entry-title">Pictures Pending for <%= pic_name %></h2>
  </header>

  <div class="entry-content wide">

    
    

  </div><!-- .wide -->



 
    <form class="navigation" encType="multipart/form-data" method="post" action="http://localhost:3030/uploadAdmin/<%= picUrl %>">
    <a class="btn" href="http://localhost:3030/foodList">Back to List</a>
    <input class="btn" name="picture" type="file" />
    <input class="btn" type="submit" />
    </form>
  
  
 

</div><!-- .site -->

<!-- The Modal -->
<div id="myModal" class="modal">
  <span class="close">&times;</span>
  <img class="modal-content" id="img01">
  <div id="caption"></div>
</div>



<script>
// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementsByClassName('food_img');
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");

console.dir(img);


for (i = 0; i < img.length; i++) {

  img[i].onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
}
}



// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() { 
    modal.style.display = "none";
}
</script>
    
    </body>`);

  let template = compiled({
    pic_name: req.params.url,
    picUrl: req.params.url

  });

  res.end(template);

});

// delete item from list
app.get("/foodDelete/:foodId", (req, res) => {
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodService");
    var toDelete = {
      id: Number(req.params.foodId)
    };
    dbo.collection("foods").deleteOne(toDelete, function (err, obj) {
      if (err) throw err;
      console.log("1 food deleted");
      db.close();

      res.redirect("/foodList");

    });
  });
});

app.post("/foodAdd", urlencodedParser, (req, res) => {

  if (!req.body) return res.sendStatus(400)

  var maxId;

  // get max id for autogeneration
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodService");
    dbo.collection("foods").find({}, {
      id: 1
    }).sort({
      id: -1
    }).toArray(function (err, result) {
      if (err) throw err;

      db.close();
      maxId = result[0].id;
      console.log(maxId);
      maxId = Number(maxId);
      let _id = ++maxId;
      console.log(`max : ${maxId} , new : ${_id}`);
      // Add food Item
      MongoClient.connect(db_url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("foodService");
        var foodToAdd = {
          id: _id,
          name: req.body.name,
          place: req.body.place,
          price: req.body.price,
          category: req.body.category
        };
        dbo.collection("foods").insertOne(foodToAdd, function (err, res) {
          if (err) throw err;
          console.log("1 Food Item inserted");
          db.close();
        });
      });

    });
  });

  res.redirect('/foodList');

})

// creation of database

// app.get("/dbCreate", (req, res) => {
//   MongoClient.connect(db_url, function (err, db) {
//     if (err) throw err;
//     var dbo = db.db("foodService");
//     dbo.collection("foods").insertMany(foodList, function (err, res) {
//       if (err) throw err;
//       console.log("Number of documents inserted: " + res.insertedCount);
//       db.close();
//     });
//   });
// });


app.listen(3030, () => console.log('Example app listening on port 3030!'))