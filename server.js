var http = require("http");
var fs = require("fs");
var path = require("path");

var _ = require('underscore-node');



function start(port, logger) {

  var outDir = path.join(__dirname, "uploads");
  var server = http.createServer(function (request, response) {

    console.log(request.url + "   " + request.method);

    // request upload of image
    if (request.url == "/upload" && request.method == "POST") {
      try {
        var Throttle = require("stream-throttle").Throttle;

        var fileName = request.headers["file-name"];
        console.log("filename : " + fileName);
        if (logger) {
          logger.log(request.method + "Request! Content-Length: " + request.headers["content-length"] + ", file-name: " + fileName);
          logger.dir(request.headers);
        }
        let file = fileName.split(".");
        // var out = path.join(outDir, "upload-" + new Date().getTime() + "-" + fileName);
        var out = path.join(outDir, file[0] + "-" + new Date().getTime() + "." + file[1]);


        if (logger) {
          logger.log("Output in: " + out);
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
            if (logger) {
              logger.log("Error ");
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
            if (logger) {
              logger.log("Terminated with error: [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
            }
          } else {
            if (logger) {
              logger.log("Data [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
            }
          }
        });

        request.on('end', function () {
          setTimeout(function () {
            if (logger) {
              logger.log("Done (" + out + ")");
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

        if (logger) {
          request.on('error', function (e) {
            logger.log('error!');
            logger.log(e);
          });
        }
      } catch (e) {
        if (logger) {
          logger.log(e);
        }
        throw e;
      }
    }

    // if request is GET LIST
    if (request.url == "/list" && request.method == "GET") {

      console.log("upload get");



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
          width: 200px;
        }
         
        h2 {
          font: 400 40px/1.5 Helvetica, Verdana, sans-serif;
          margin: 0;
          padding: 0;
        }
         
        ul {
          list-style-type: none;
          margin: 0;
          padding: 0;
        }
         
        li {
          font: 200 20px/1.5 Helvetica, Verdana, sans-serif;
          border-bottom: 1px solid #ccc;
        }
         
        li:last-child {
          border: none;
        }
         
        li a {
          text-decoration: none;
          color: #000;
          display: block;
          width: 200px;
         
          -webkit-transition: font-size 0.3s ease, background-color 0.3s ease;
          -moz-transition: font-size 0.3s ease, background-color 0.3s ease;
          -o-transition: font-size 0.3s ease, background-color 0.3s ease;
          -ms-transition: font-size 0.3s ease, background-color 0.3s ease;
          transition: font-size 0.3s ease, background-color 0.3s ease;
        }
         
        li a:hover {
          font-size: 30px;
          background: #f6f6f6;
        }
        </style>
      </head>
      
      <body>
        <h1>
          <div>
            <h5>
              <%= name %>
            </h5>
            <ul>
              <% for(var pic in pics) { %>
                <li>
                <a href="http://localhost:3030/food"><%= pics[pic] %></a>
                  
                </li>
                <% } %>
            </ul>
          </div>
        </h1>
      
      </body>`);



      // get the pictures in uploads folder and put them in list
      let _folder = "./uploads/";
      let picturesList = [];
      let pictureGroups = [];


      fs.readdir(_folder, (err, files) => {
        files.forEach(file => {
          picturesList.push(file);
        });
        picturesList.forEach(function (value) {
          if (!_.contains(pictureGroups, value.split("-")[0])) {
            pictureGroups.push(value.split("-")[0]);
          }
        });

        console.log(pictureGroups);

        let template = compiled({
          pics: pictureGroups,
          name: `CheeseBurger`
        });
        response.end(template);
      });

    }

    // request of group of images of a food item
    if (request.url == "/food" && request.method == "GET") {
      console.log("food item request");

      var compiled = _.template(`
      <!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
        <style>
       img{
         width: 400px;
         height: 400px;
       }
        </style>
      </head>
      
      <body>

          <img src="" alt="picture" />

      
      </body>`);


      let template = compiled();
      response.end(template);


    }

    // gestion des images

  });

  server.listen(port)
  if (logger) {
    logger.log("Server is listening on: " + port);
    logger.log("Uploads are saved to: " + outDir);
  }

  return {
    close: function () {
      server.close();
    }
  }
}
exports.start = start;

// if (process.argv.length === 3) {
// var port = parseInt(process.argv[2]);
start(3030, console);
// }