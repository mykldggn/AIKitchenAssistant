const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// Create user profile
router.post('/', async (req, res) => {
  try {
    console.log('Received user data:', JSON.stringify(req.body, null, 2));
    
    // Log the structure of the request
    console.log('Request body shape:', Object.keys(req.body));
    
    // Create a new user with the data
    const user = new User(req.body);
    console.log('User model created');
    
    // Save the user
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);
    
    // Send the response
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('ERROR CREATING USER:');
    console.error(error.name, ':', error.message);
    console.error('Error stack:', error.stack);
    
    // Send appropriate error response
    res.status(500).json({ 
      message: `Error creating user: ${error.message}`,
      name: error.name
    });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { 
new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update pantry items
router.put('/:id/pantry', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.pantryItems = req.body.pantryItems;
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add items to pantry
router.post('/:id/pantry', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Add new pantry items
    const newItems = req.body.items;
    user.pantryItems.push(...newItems);
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
