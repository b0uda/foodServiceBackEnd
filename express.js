const express = require('express')
const app = express()
var fs = require("fs");
const fileUpload = require('express-fileupload');

var path = require("path");
var multiparty = require('multiparty');

var _ = require('underscore-node');

var FormData = require('form-data');

var food = require("./food-list.json");

let foodList = food.foods;

app.use(fileUpload());

app.use("/public", express.static('public'));
app.use("/uploads", express.static('uploads'));

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
        <a class="btn" href="http://localhost:3030/list">Back to List</a>
    </div>`);

  });




});



// list of pictures pending and validated


app.get("/list", (request, response) => {




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

  <form class="navigation" encType="multipart/form-data" method="post" action="http://localhost:3030/uploadAdmin/<%= pics[0].split("-")[0] %>">
  <a class="btn" href="http://localhost:3030/list">Back to List</a>
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
        <a class="btn" href="http://localhost:3030/list">Back to List</a>
    </div>`);

  });



});



// NON image part



// get all food
app.get('/allFood', function (req, res) {
  res.json(foodList);
})

// get all food
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
  const places = ["All", "mcdonalds", "Authentik", "Pizza Hut", "khalid", "Tacos de Lyon"];
  res.json(places);
})

// get food by budget
app.get('/budgetFood/:budget', function (req, res) {

  const budget = req.params.budget;

  let foodListFiltred = [];

  foodList.forEach(food => {
    if (food.price <= budget) {
      foodListFiltred.push(food);
    }
  });



  res.json(foodListFiltred);
})

// filter food by category
app.get('/categoryFood/:budget/:category', function (req, res) {
  const budget = req.params.budget;
  const category = req.params.category;

  console.log(`budget : ${budget} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    if (food.price <= budget && food.category === category) {
      foodListFiltred.push(food);
    }
  });



  res.json(foodListFiltred);
})

// filter food by place
app.get('/placeFood/:budget/:place', function (req, res) {
  const budget = req.params.budget;
  const place = req.params.place;

  console.log(`budget : ${budget} && place: ${place}`);

  let foodListFiltred = [];
  console.log(place);
  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (food.price <= budget && food_place === place) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
})


// filter food by category and place
app.get('/categoryAndPlaceFood/:budget/:category/:place', function (req, res) {
  const budget = req.params.budget;
  const place = req.params.place;
  const category = req.params.category;

  console.log(`budget : ${budget} && place: ${place} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (food.price <= budget && food_place === place && food.category === category) {
      foodListFiltred.push(food);
    }
  });



  res.json(foodListFiltred);
})


app.listen(3030, () => console.log('Example app listening on port 3000!'))