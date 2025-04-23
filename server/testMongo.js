const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });
