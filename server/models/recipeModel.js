const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  ingredients: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  instructions: [{
    type: String
  }],
  prepTime: {
    type: Number, // in minutes
  },
  cookTime: {
    type: Number, // in minutes
  },
  servings: {
    type: Number,
    default: 1
  },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    fiber: Number,
    sugar: Number
  },
  tags: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String
  }
}, {
  timestamps: true
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
