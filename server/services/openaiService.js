const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate recipes based on available ingredients and user preferences
 * @param {Array} ingredients - List of available ingredients
 * @param {Object} userProfile - User dietary preferences and nutritional goals
 * @param {String} imageFilePath - Path to uploaded image (optional)
 * @returns {Promise<Object>} - Generated recipe with nutritional information
 */
async function generateRecipe(ingredients, userProfile, imageFilePath = null) {
  try {
    console.log('Generating recipe with ingredients:', ingredients);
    
    // Build the message content
    const systemContent = "You are an expert chef and nutritionist. Generate a detailed recipe using the provided ingredients that aligns with the user's dietary preferences and nutritional goals. Your response must be valid JSON only, without any markdown formatting or additional text.";
    
    const userTextContent = `Generate a recipe with these ingredients: ${ingredients.join(', ')}.

User profile:
- Diet: ${userProfile.diet || 'No specific diet'}
- Diet details: ${userProfile.dietDetails || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Nutritional goals: ${userProfile.nutritionGoals?.calories || 2000} calories, ${userProfile.nutritionGoals?.protein || 150}g protein, ${userProfile.nutritionGoals?.carbs || 225}g carbs, ${userProfile.nutritionGoals?.fats || 65}g fats

IMPORTANT: Your response must be a valid JSON object with the following structure and nothing else:
{
  "name": "Recipe Name",
  "ingredients": [{"name": "ingredient1", "quantity": 100, "unit": "g"}],
  "instructions": ["Step 1", "Step 2"],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 2,
  "nutrition": {"calories": 500, "protein": 25, "carbs": 45, "fats": 20, "fiber": 5, "sugar": 10},
  "tags": ["tag1", "tag2"],
  "difficulty": "medium"
}`;

    // Create the messages array
    const messages = [
      {
        role: "system",
        content: systemContent
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userTextContent
          }
        ]
      }
    ];

    // Add image content if provided
    if (imageFilePath) {
      try {
        const imageBuffer = fs.readFileSync(imageFilePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Add image to the user message
        messages[1].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        });
      } catch (imageError) {
        console.error('Error processing image:', imageError);
      }
    }

    console.log('Sending request to OpenAI for recipe');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" } // Force JSON response format
    });

    // Parse JSON from response
    const recipeText = response.choices[0].message.content;
    console.log('Received response from OpenAI:', recipeText.substring(0, 200) + '...');
    
    try {
      // Try to clean the response if it has markdown code blocks
      let cleanedText = recipeText;
      if (recipeText.includes('```json')) {
        cleanedText = recipeText.replace(/```json\n|\n```/g, '');
      } else if (recipeText.includes('```')) {
        cleanedText = recipeText.replace(/```\n|\n```/g, '');
      }
      
      // Try to parse the JSON
      console.log('Parsing JSON response');
      const recipeJson = JSON.parse(cleanedText);
      
      // Validate the JSON structure
      if (!recipeJson.name || !recipeJson.ingredients || !Array.isArray(recipeJson.ingredients)) {
        throw new Error('Invalid recipe structure: missing name or ingredients');
      }
      
      console.log('Successfully parsed recipe data');
      return recipeJson;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError.message);
      console.error('Raw response:', recipeText);
      throw new Error('Failed to parse recipe data from OpenAI response');
    }
  } catch (error) {
    console.error('Error generating recipe:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Generate meal plan for tomorrow using remaining ingredients
 * @param {Array} remainingIngredients - List of remaining ingredients
 * @param {Object} userProfile - User dietary preferences and nutritional goals
 * @param {Number} maxNewIngredients - Maximum number of new ingredients to add
 * @returns {Promise<Object>} - Tomorrow's meal plan
 */
async function generateTomorrowsMealPlan(remainingIngredients, userProfile, maxNewIngredients = 3) {
  try {
    console.log('Generating meal plan with ingredients:', remainingIngredients);
    
    // Explicitly format the user message
    const userMessage = `Generate a meal plan for tomorrow using these remaining ingredients: ${remainingIngredients.join(', ')}.

User profile:
- Diet: ${userProfile.diet || 'No specific diet'}
- Diet details: ${userProfile.dietDetails || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Nutritional goals: ${userProfile.nutritionGoals?.calories || 2000} calories, ${userProfile.nutritionGoals?.protein || 150}g protein, ${userProfile.nutritionGoals?.carbs || 225}g carbs, ${userProfile.nutritionGoals?.fats || 65}g fats

You can suggest adding up to ${maxNewIngredients} additional ingredients to buy from the store.

IMPORTANT: Your response must be a valid JSON object with the following structure and nothing else:
{
  "meals": [
    {
      "name": "Meal 1 Name",
      "ingredients": [{"name": "ingredient1", "quantity": 100, "unit": "g"}],
      "instructions": ["Step 1", "Step 2"],
      "nutrition": {"calories": 500, "protein": 25, "carbs": 45, "fats": 20}
    }
  ],
  "additionalIngredientsToBuy": ["ingredient1", "ingredient2", "ingredient3"],
  "totalNutrition": {"calories": 1500, "protein": 75, "carbs": 135, "fats": 60}
}`;

    console.log('Sending request to OpenAI for meal plan');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert meal planner and nutritionist. Generate a meal plan for tomorrow using the remaining ingredients. Your response must be valid JSON only, without any markdown formatting or additional text."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" } // Force JSON response format
    });

    // Parse JSON from response
    const mealPlanText = response.choices[0].message.content;
    console.log('Received response from OpenAI:', mealPlanText.substring(0, 200) + '...');
    
    try {
      // Try to clean the response if it has markdown code blocks
      let cleanedText = mealPlanText;
      if (mealPlanText.includes('```json')) {
        cleanedText = mealPlanText.replace(/```json\n|\n```/g, '');
      } else if (mealPlanText.includes('```')) {
        cleanedText = mealPlanText.replace(/```\n|\n```/g, '');
      }
      
      // Try to parse the JSON
      console.log('Parsing JSON response');
      const mealPlanJson = JSON.parse(cleanedText);
      
      // Validate the JSON structure
      if (!mealPlanJson.meals || !Array.isArray(mealPlanJson.meals) || mealPlanJson.meals.length === 0) {
        throw new Error('Invalid meal plan structure: missing or empty meals array');
      }
      
      console.log('Successfully parsed meal plan data');
      return mealPlanJson;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError.message);
      console.error('Raw response:', mealPlanText);
      throw new Error('Failed to parse meal plan data from OpenAI response');
    }
  } catch (error) {
    console.error('Error generating meal plan:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Analyze food from image
 * @param {String} imageFilePath - Path to uploaded image
 * @returns {Promise<Object>} - Identified ingredients and quantities
 */
async function analyzeFood(imageFilePath) {
  try {
    const imageBuffer = fs.readFileSync(imageFilePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in food recognition. Identify all ingredients visible in the image and estimate their quantities."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What ingredients do you see in this image? Please list all visible items with estimated quantities if possible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content;
    
    // Process the analysis text to extract ingredients
    const ingredients = parseIngredientsFromAnalysis(analysisText);
    
    return {
      rawAnalysis: analysisText,
      ingredients: ingredients
    };
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw error;
  }
}

/**
 * Parse ingredients from the analysis text
 * @param {String} analysisText - The raw text analysis from OpenAI
 * @returns {Array} - Array of ingredient objects
 */
function parseIngredientsFromAnalysis(analysisText) {
  // This is a simple implementation; you might want to use a more sophisticated approach
  const lines = analysisText.split('\n');
  const ingredients = [];
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    // Try to match "ingredient - quantity unit" pattern
    const match = line.match(/^\s*-?\s*([\w\s]+)(?:\s*-\s*|\s*:\s*)(?:about\s+)?(\d+(?:\.\d+)?)\s*(\w+)?/i);
    
    if (match) {
      ingredients.push({
        name: match[1].trim(),
        quantity: parseFloat(match[2]),
        unit: match[3] ? match[3].trim() : ''
      });
    } else if (line.includes(':') || line.includes('-')) {
      // Handle other formats
      const parts = line.includes(':') ? line.split(':') : line.split('-');
      if (parts.length >= 2) {
        const name = parts[0].replace(/^\s*-\s*/, '').trim();
        const quantityPart = parts[1].trim();
        
        // Try to extract quantity and unit from the second part
        const quantityMatch = quantityPart.match(/(\d+(?:\.\d+)?)\s*(\w+)?/);
        
        if (quantityMatch) {
          ingredients.push({
            name: name,
            quantity: parseFloat(quantityMatch[1]),
            unit: quantityMatch[2] ? quantityMatch[2].trim() : ''
          });
        } else {
          // If no quantity could be extracted, just store the name
          ingredients.push({
            name: name,
            quantity: null,
            unit: ''
          });
        }
      }
    }
  }
  
  return ingredients;
}

module.exports = {
  generateRecipe,
  generateTomorrowsMealPlan,
  analyzeFood
};
