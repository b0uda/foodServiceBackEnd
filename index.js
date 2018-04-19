const express = require('express')
const fileUpload = require('express-fileupload');
const app = express();
var multiparty = require('multiparty');

var FormData = require('form-data');

app.use(fileUpload());


app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3030, () => console.log('Example app listening on port 3030!'));



app.post('/uploadAdmin/:foodId', function (req, res) {

  console.log("upload request");

  var form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    res.writeHead(200, {
      'content-type': 'text/plain'
    });
    res.write('received upload:\n\n');
    res.end(util.inspect({
      fields: fields,
      files: files
    }));
  });


  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.img;


  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('./upload/test.svg', function (err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});