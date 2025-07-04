from flask import Flask, render_template, send_from_directory, request
import os
import uuid
from utils.gemini_output import get_gemini_response
from utils.run_yolo import run_yolo_on_image

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/saved_images/<path:filename>")
def serve_saved_image(filename):
    return send_from_directory("saved_images", filename)


@app.route("/infer_image", methods=["POST"])
def infer_image():
    try:
        if "image" not in request.files:
            return render_template("error.html", data="No image uploaded")

        image = request.files["image"]
        if image.filename == "":
            return render_template("error.html", data="No selected file")

        # === Save image with unique name ===
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.jpg"
        captured_folder = "captured_images"
        saved_folder = "saved_images"
        os.makedirs(captured_folder, exist_ok=True)
        os.makedirs(saved_folder, exist_ok=True)

        capture_path = os.path.join(captured_folder, filename)
        image.save(capture_path)
        
        # === Run YOLO + Get Gemini Output ===
        predicted_classes, boxes_info = run_yolo_on_image(capture_path, saved_folder)
        print(predicted_classes)
        gemini_response = get_gemini_response(
            details={"classes": predicted_classes, "boxes": boxes_info},
            image_path=filename
        )
      
        # === Render result page ===
        return render_template(
        "output.html",
        data={
                "model_output_filename": filename,
                "predicted_classes": predicted_classes,
                "boxes": boxes_info,
                "nutrition_data": gemini_response.get("nutrition_data", []),
                "suggestions": gemini_response.get("suggestions", [])
            }
        )


    except Exception as e:
        print("Exception during /infer_image:", e)
        return render_template("error.html", data=str(e))


if __name__ == "__main__":
    os.makedirs("saved_images", exist_ok=True)
    os.makedirs("captured_images", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5000)
