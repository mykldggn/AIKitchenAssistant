const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  height: {
    type: Number,
    required: Number
  },
  weight: {
    type: Number,
    required: Number
  },
  diet: {
    type: String,
    enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'paleo', 
'keto', 'gluten-free', 'dairy-free', 'other'],
    default: 'omnivore'
  },
  dietDetails: {
    type: String
  },
  nutritionGoals: {
    calories: {
      type: Number,
      default: 2000
    },
    protein: {
      type: Number,
      default: 150
    },
    fats: {
      type: Number,
      default: 65
    },
    carbs: {
      type: Number,
      default: 225
    }
  },
  allergies: [{
    type: String
  }],
  preferences: {
    cuisinePreferences: [{ type: String }],
    dislikedIngredients: [{ type: String }],
    favoriteRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 
'Recipe' }]
  },
  pantryItems: [{
    name: String,
    quantity: Number,
    unit: String,
    expiryDate: Date
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
