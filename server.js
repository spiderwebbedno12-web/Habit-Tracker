 const express = require('express');
const app = express();
const port = 3000;

// This tells the server to serve your HTML files from the "public" folder
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Habit tracker app is running! Go to http://localhost:${port}`);
});
