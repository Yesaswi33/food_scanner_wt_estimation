from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import uuid
import shutil
import cv2
import numpy as np
from ultralytics import YOLO
from utils.gemini_output import get_gemini_response
from utils.colors import get_color_for_class
from utils.run_yolo import run_yolo_on_image

app = Flask(__name__)

# Global color map to ensure consistent colors for same classes
color_map = {}



@app.route("/")
def index():
    return render_template("index.html")


@app.route("/latest_model_image")
def latest_model_image():
    folder = "saved_images"
    if not os.path.exists(folder):
        return jsonify({"filename": None})
    files = [
        f for f in os.listdir(folder) if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    if not files:
        return jsonify({"filename": None})
    latest_file = max(files, key=lambda x: os.path.getmtime(os.path.join(folder, x)))
    return jsonify({"filename": latest_file})


@app.route("/saved_images/<path:filename>")
def serve_saved_image(filename):
    return send_from_directory("saved_images", filename)


@app.route("/infer_image", methods=["POST"])
def infer_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        image = request.files["image"]
        if image.filename == "":
            return jsonify({"error": "No selected file"}), 400

        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.jpg"

        captured_folder = "captured_images"
        saved_folder = "saved_images"
        os.makedirs(captured_folder, exist_ok=True)
        os.makedirs(saved_folder, exist_ok=True)

        capture_path = os.path.join(captured_folder, filename)
        image.save(capture_path)

        predicted_classes, boxes_info = run_yolo_on_image(capture_path, saved_folder)
        response= get_gemini_response(details={predicted_classes,boxes_info},image_path=filename);
        data={
                message: "Image uploaded and model run",
                model_output_filename: filename,
                predicted_classes: predicted_classes,
                boxes: boxes_info,
                gemini_response: response,
            }
        return render_template("output.html",data)
    except Exception as e:
        print(e)
        return render_template("error.html",e.message)





if __name__ == "__main__":
    os.makedirs("saved_images", exist_ok=True)
    os.makedirs("captured_images", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5000)