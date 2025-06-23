from flask import Flask, render_template, jsonify, request, send_from_directory

# from flask_cors import CORS
import os
import datetime

app = Flask(__name__)
# CORS(app)

nutrition_db = {
    "apple": {
        "calories": 52,
        "protein": "0.3g",
        "carbs": "14g",
        "fat": "0.2g",
        "fiber": "2.4g",
        "sugar": "10g",
    },
    "banana": {
        "calories": 89,
        "protein": "1.1g",
        "carbs": "23g",
        "fat": "0.3g",
        "fiber": "2.6g",
        "sugar": "12g",
    },
    "orange": {
        "calories": 47,
        "protein": "0.9g",
        "carbs": "12g",
        "fat": "0.1g",
        "fiber": "2.2g",
        "sugar": "9g",
    },
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/nutrition/<item_name>")
def get_nutrition(item_name):
    item = item_name.lower()
    data = nutrition_db.get(item)
    if not data:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"name": item, **data})


@app.route("/capture", methods=["POST"])
def capture_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    image = request.files["image"]
    if image.filename == "":
        return jsonify({"error": "No selected file"}), 400
    folder = "captured_images"
    if not os.path.exists(folder):
        os.makedirs(folder)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"capture_{timestamp}.png"
    filepath = os.path.join(folder, filename)
    image.save(filepath)
    return jsonify({"message": "Image saved", "filename": filename})


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    if not os.path.exists("templates"):
        os.makedirs("templates")
    if not os.path.exists("captured_images"):
        os.makedirs("captured_images")
    app.run(debug=True, host="0.0.0.0", port=5000)
