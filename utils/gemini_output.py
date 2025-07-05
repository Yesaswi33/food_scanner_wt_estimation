import google.generativeai as genai
from PIL import Image
import os

# Set your API key
GOOGLE_API_KEY = "AIzaSyCOoGgp5MjH9D71QTZ-Y92UnC8dcSU57ls"
genai.configure(api_key=GOOGLE_API_KEY)

# Load the model (Gemini Pro for text or Gemini Pro Vision for image+text)
vision_model = genai.GenerativeModel("gemini-1.5-flash")




def get_gemini_response(details, image_path=None):
    prompt = """
You are a nutrition estimation expert. Given an image containing one or more food items (some with bounding boxes), your task is to:

- Identify each food item.
- Estimate nutritional values per item, including: calories, proteins (g), fats (g), and carbohydrates (g).
- Provide two personalized dietary suggestions based on the overall plate.

Return the response strictly in the following JSON format:

{
  "nutrition_data": [
    {
      "food_item": "<name>",
      "calories": <int>,
      "proteins": <float>,
      "fat": <float>,
      "carbs": <float>
    },
    ...
  ],
  "suggestions": [
    "<suggestion_1>",
    "<suggestion_2>"
  ]
}
if multiple number of boxes detected for single dish give output as by adding there nutrition like in the below format
"nutrition_data": [
    {
      "food_item": "idly X 3",
      "calories": <int>,
      "proteins": <float>,
      "fat": <float>,
      "carbs": <float>
    },

Only return valid JSON. Do not include any explanation or extra text.
"""

    
    
    print(image_path)
    if image_path:
        image = Image.open(os.path.join("saved_images",image_path))
        
        response = vision_model.generate_content([prompt, image])
    try:
        # Auto-extract JSON if model outputs extra text
        import json
        import re

        json_string = re.search(r"\{[\s\S]*\}", response.text).group(0)
        return json.loads(json_string)
    except Exception as e:
        print("Failed to parse Gemini response:", e)
        return {"error": "Invalid response from Gemini", "raw": response.text}

