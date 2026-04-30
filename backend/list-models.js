const axios = require('axios');
const KEY = 'AIzaSyA4PDM3JDc_LmXue9FBeSdnnNsY9BU3b80';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`;

axios.get(url)
  .then(res => {
    console.log('Available models:');
    res.data.models.forEach(m => console.log(m.name));
  })
  .catch(err => console.error(err.response?.data || err.message));
