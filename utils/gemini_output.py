import google.generativeai as genai
from PIL import Image
import os

# Set your API key
GOOGLE_API_KEY = "AIzaSyDUIuGISoHdDKOkSu64Y4m5StsyaBTIoek"
genai.configure(api_key=GOOGLE_API_KEY)

# Load the model (Gemini Pro for text or Gemini Pro Vision for image+text)
vision_model = genai.GenerativeModel("gemini-1.5-flash")




def get_gemini_response(details, image_path=None):
    prompt = (
    "From the image provided, estimate:\n"
    "- The name of the dish\n"
    "- Approximate quantity in grams\n"
    "- Calorie estimate\n"
    "- Macronutrient breakdown (carbs, protein, fats)\n"
    "Also provide 2 personalized nutrition suggestions based on what you see."
    )
    print(image_path)
    if image_path:
        image = Image.open(os.path.join("saved_images",image_path))
        
        response = vision_model.generate_content([prompt, image])
    print("Gemini Response:", response.text)
    return response.text

