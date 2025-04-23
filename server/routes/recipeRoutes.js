const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Recipe = require('../models/recipeModel');
const User = require('../models/userModel');
const openaiService = require('../services/openaiService');

// Set up file storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Generate recipe based on ingredients
router.post('/generate', upload.single('image'), async (req, res) => {
  try {
    console.log('Received generate recipe request');
    const { userId, ingredients } = req.body;
    
    console.log('Request body:', JSON.stringify(req.body));
    
    // Validate inputs
    if (!userId) {
      console.error('Missing userId in request');
      return res.status(400).json({ message: 'userId is required' });
    }
    
    if (!ingredients) {
      console.error('Missing ingredients in request');
      return res.status(400).json({ message: 'ingredients are required' });
    }
    
    // Get user profile for dietary preferences
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('Found user:', user._id, user.name);
      
      let ingredientsList = [];
      if (typeof ingredients === 'string') {
        ingredientsList = ingredients.split(',').map(item => item.trim());
      } else if (Array.isArray(ingredients)) {
        ingredientsList = ingredients;
      }
      
      console.log('Ingredients list:', ingredientsList);
      
      // Check if an image was uploaded
      let imagePath = null;
      if (req.file) {
        imagePath = req.file.path;
        console.log('Image uploaded:', imagePath);
      }
      
      try {
        // Generate recipe using OpenAI
        console.log('Calling OpenAI service with ingredientsList length:', ingredientsList.length);
        const recipeData = await openaiService.generateRecipe(ingredientsList, user, imagePath);
        console.log('Recipe generated successfully, data type:', typeof recipeData);
        
        // Save the generated recipe to the database
        console.log('Creating Recipe model with data:', JSON.stringify(recipeData).substring(0, 100) + '...');
        const recipe = new Recipe({
          ...recipeData,
          userId: userId,
          isAIGenerated: true,
          imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
        
        console.log('Saving recipe to database...');
        await recipe.save();
        console.log('Recipe saved to database:', recipe._id);
        
        res.status(201).json(recipe);
      } catch (openaiError) {
        console.error('OpenAI service error:', openaiError.message);
        console.error('OpenAI error stack:', openaiError.stack);
        res.status(500).json({ message: `OpenAI service error: ${openaiError.message}` });
      }
    } catch (userError) {
      console.error('Error finding user:', userError.message);
      console.error('User error stack:', userError.stack);
      res.status(500).json({ message: `Error finding user: ${userError.message}` });
    }
  } catch (error) {
    console.error('General error in recipe generation:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Unknown server error' });
  }
});

// Generate tomorrow's meal plan
router.post('/plan-tomorrow', async (req, res) => {
  try {
    console.log('Received meal plan request');
    const { userId, remainingIngredients, maxNewIngredients } = req.body;
    
    console.log('Request data:', { userId, ingredients: remainingIngredients, maxItems: maxNewIngredients });
    
    // Validate inputs
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    if (!remainingIngredients) {
      return res.status(400).json({ message: 'remainingIngredients are required' });
    }
    
    // Get user profile for dietary preferences
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      let ingredientsList = [];
      if (typeof remainingIngredients === 'string') {
        ingredientsList = remainingIngredients.split(',').map(item => item.trim());
      } else if (Array.isArray(remainingIngredients)) {
        ingredientsList = remainingIngredients;
      }
      
      console.log('Processing ingredients:', ingredientsList);
      
      try {
        // Generate meal plan using OpenAI
        const mealPlan = await openaiService.generateTomorrowsMealPlan(
          ingredientsList, 
          user, 
          maxNewIngredients || 3
        );
        
        console.log('Meal plan generated successfully');
        res.json(mealPlan);
      } catch (openaiError) {
        console.error('OpenAI service error:', openaiError);
        if (openaiError.message.includes('parse')) {
          res.status(500).json({ 
            message: 'Failed to parse meal plan data from OpenAI response',
            error: 'JSON_PARSE_ERROR'
          });
        } else {
          res.status(500).json({ 
            message: `OpenAI service error: ${openaiError.message}`,
            error: 'OPENAI_SERVICE_ERROR'
          });
        }
      }
    } catch (userError) {
      console.error('Error finding user:', userError);
      res.status(500).json({ message: `Error finding user: ${userError.message}` });
    }
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ message: error.message || 'Unknown server error' });
  }
});

// Analyze food image
router.post('/analyze-image', upload.single('image'), async (req, res) => 
{
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // Analyze the food image
    const analysis = await openaiService.analyzeFood(req.file.path);
    
    res.json({
      analysis: analysis,
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error analyzing food image:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all recipes for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.params.userId });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific recipe
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' 
});
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
