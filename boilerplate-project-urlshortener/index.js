require('dotenv').config();
const mongoose = require('mongoose');
const urlparser = require('url');
const dns = require('dns');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error(err));

const urlSchema = new mongoose.Schema({
  url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  const inputUrl = req.body.url;

  try {
    const parsedUrl = urlparser.parse(inputUrl);

    // Check if the URL is in the correct format
    if (!parsedUrl.protocol || !parsedUrl.hostname) {
      throw 'invalid url';
    }

    await new Promise((resolve, reject) => {
      dns.lookup(parsedUrl.hostname, (err, address) => {
        if (err) {
          reject('invalid url');
        } else {
          resolve();
        }
      });
    });

    const urlCount = await Url.countDocuments({});
    const urlDoc = {
      url: inputUrl,
      short_url: urlCount
    };

    const result = await Url.create(urlDoc);
    console.log(result);
    res.json({ original_url: inputUrl, short_url: urlCount });
  } catch (error) {
    res.json({ error });
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = req.params.short_url;
  const urlDoc = await Url.findOne({ short_url: +shortUrl });
  if (urlDoc === null) {
    res.json({ error: 'No short URL found for the given input' });
  } else {
    res.redirect(urlDoc.url)
  }
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
