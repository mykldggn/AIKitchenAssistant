# AI Kitchen Assistant

AI Kitchen Assistant is a Node.js and Express backend for generating personalized recipes, food-image analysis, pantry tracking, and next-day meal planning. It combines user dietary preferences, pantry ingredients, optional food images, MongoDB persistence, and OpenAI-powered recipe generation.

## Features

- Create and update user nutrition profiles.
- Store pantry items with quantities, units, and expiry dates.
- Generate AI recipes from available ingredients.
- Include uploaded food images in recipe-generation requests.
- Analyze food images to identify visible ingredients.
- Generate tomorrow's meal plan from leftover ingredients.
- Save generated recipes to MongoDB.
- Retrieve recipes by user or recipe ID.

## Tech Stack

- Node.js
- Express
- MongoDB and Mongoose
- OpenAI API
- Multer image uploads
- dotenv environment configuration
- CORS middleware

## Project Structure

```text
AIKitchenAssistant/
├── package.json                 # root scripts for multi-service setup
├── server/
│   ├── Server.js                # Express API entrypoint
│   ├── models/
│   │   ├── recipeModel.js       # generated recipe schema
│   │   └── userModel.js         # user, pantry, and nutrition profile schema
│   ├── routes/
│   │   ├── recipeRoutes.js      # recipe generation, meal planning, image analysis
│   │   └── userRoutes.js        # user profile and pantry endpoints
│   ├── services/
│   │   └── openaiService.js     # OpenAI recipe, meal-plan, and image-analysis logic
│   └── uploads/                 # uploaded food images
└── client/                      # frontend placeholder in the current repo snapshot
```

## Environment Variables

Create `server/.env`:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
OPENAI_API_KEY=sk-...
PORT=5002
```

`PORT` is optional. The server defaults to `5002`.

## Installation

```bash
git clone https://github.com/mykldggn/AIKitchenAssistant.git
cd AIKitchenAssistant
npm install
cd server
npm install
```

## Running The Backend

From the `server/` directory:

```bash
node Server.js
```

The API will run at:

```text
http://localhost:5002
```

Note: the root `npm start` script expects both `server` and `client` apps. In the current repo snapshot, the backend is the runnable surface.

## API Overview

### Users

Create a user profile:

```http
POST /api/users
```

Example body:

```json
{
  "name": "Alex",
  "height": 70,
  "weight": 175,
  "diet": "omnivore",
  "allergies": ["peanuts"],
  "nutritionGoals": {
    "calories": 2200,
    "protein": 160,
    "carbs": 230,
    "fats": 70
  },
  "pantryItems": [
    { "name": "chicken breast", "quantity": 2, "unit": "lbs" },
    { "name": "rice", "quantity": 1, "unit": "bag" }
  ]
}
```

Other user routes:

```http
GET /api/users/:id
PUT /api/users/:id
PUT /api/users/:id/pantry
POST /api/users/:id/pantry
```

### Recipes

Generate a recipe:

```http
POST /api/recipes/generate
```

Form fields:

- `userId`: MongoDB user ID
- `ingredients`: comma-separated ingredients or array
- `image`: optional uploaded food image

Generate tomorrow's meal plan:

```http
POST /api/recipes/plan-tomorrow
```

Example body:

```json
{
  "userId": "<mongo-user-id>",
  "remainingIngredients": ["chicken", "rice", "broccoli"],
  "maxNewIngredients": 3
}
```

Analyze a food image:

```http
POST /api/recipes/analyze-image
```

Form field:

- `image`: uploaded JPG, JPEG, PNG, or GIF

Retrieve saved recipes:

```http
GET /api/recipes/user/:userId
GET /api/recipes/:id
```

## Example Curl Requests

Create a user:

```bash
curl -X POST http://localhost:5002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex",
    "height": 70,
    "weight": 175,
    "diet": "omnivore",
    "pantryItems": [
      { "name": "eggs", "quantity": 12, "unit": "count" },
      { "name": "spinach", "quantity": 1, "unit": "bag" }
    ]
  }'
```

Generate a recipe:

```bash
curl -X POST http://localhost:5002/api/recipes/generate \
  -F "userId=<mongo-user-id>" \
  -F "ingredients=eggs, spinach, feta, sourdough"
```

Analyze a food image:

```bash
curl -X POST http://localhost:5002/api/recipes/analyze-image \
  -F "image=@/path/to/food.jpg"
```

## Data Models

The user model stores:

- body metrics
- diet type and diet details
- nutrition goals
- allergies
- cuisine preferences
- disliked ingredients
- favorite recipes
- pantry items

The recipe model stores:

- recipe name
- ingredients and quantities
- instructions
- prep and cook time
- servings
- nutrition facts
- tags and difficulty
- generated image URL
- user association

## Notes

- Uploaded files are stored under `server/uploads/` and served from `/uploads`.
- OpenAI responses are requested in JSON format and parsed before saving to MongoDB.
- Do not commit `.env` files or production credentials.
- For a production deployment, move uploads to object storage and add authentication around user and recipe routes.

