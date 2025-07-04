import google.generativeai as genai
from PIL import Image
import os

# Set your API key
GOOGLE_API_KEY = "AIzaSyDUIuGISoHdDKOkSu64Y4m5StsyaBTIoek"
genai.configure(api_key=GOOGLE_API_KEY)

# Load the model (Gemini Pro for text or Gemini Pro Vision for image+text)
vision_model = genai.GenerativeModel("gemini-1.5-flash")

# --- IMAGE + TEXT Prompt Example ---
image_path = "../test.jpg"  # Path to your food image
image = Image.open(image_path)

prompt = (
    "From the image provided, estimate:\n"
    "- The name of the dish\n"
    "- Approximate quantity in grams\n"
    "- Calorie estimate\n"
    "- Macronutrient breakdown (carbs, protein, fats)\n"
    "Also provide 2 personalized nutrition suggestions based on what you see."
)


# response = vision_model.generate_content([prompt, image])
# print("Image + Text Response:", response.text)


def get_gemini_response(prompt, image_path=None):
    """
    Get a response from Gemini based on the provided prompt and optional image.
    
    :param prompt: The text prompt to send to Gemini.
    :param image_path: Optional path to an image file for vision models.
    :return: The response text from Gemini.
    
    give me the output such that I can use it in my html
    
    
    """
    if image_path:
        image = Image.open(image_path)
        response = vision_model.generate_content([prompt, image])
    print("Gemini Response:", response.text)
    return response.text

get_gemini_response(prompt, image_path=image_path)