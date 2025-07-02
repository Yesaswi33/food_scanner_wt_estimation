from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import uuid
import shutil

app = Flask(__name__)


@app.route("/")
def index():
    # return render_template("video_capture.html")
    return render_template("updated.html")


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


@app.route("/upload_and_infer_image", methods=["POST"])
def upload_and_infer_image():
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

        predicted_classes = run_yolo_on_image(capture_path, saved_folder)

        return jsonify(
            {
                "message": "Image uploaded and model run",
                "model_output_filename": filename,
                "predicted_classes": predicted_classes,
            }
        )

    except Exception as e:
        return (
            jsonify({"error": f"Exception during upload or inference: {str(e)}"}),
            500,
        )


@app.route("/capture_user_image_and_infer", methods=["POST"])
def capture_user_image_and_infer():
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

    try:
        predicted_clasees = run_yolo_on_image(capture_path, saved_folder)
        return jsonify(
            {
                "message": "Image captured and model run",
                "model_output_filename": filename,
                "predicted_classes": predicted_clasees,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def run_yolo_on_image(input_path, output_dir):
    from ultralytics import YOLO

    model_version = "best-so-far.pt"
    model_path = os.path.join("models", model_version)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: models/{model_version}")

    model = YOLO(model_path)
    input_filename = os.path.basename(input_path)

    # Run YOLOv8 inference
    results = model.predict(
        source=input_path, save=True, project="temp", name="run", exist_ok=True
    )

    # Get predicted class names
    predicted_classes = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            predicted_classes.append(class_name)

    print(set(predicted_classes))

    # Move YOLO output image to saved_images/<uuid>.png
    yolo_output_path = os.path.join("temp", "run", input_filename)
    final_output_path = os.path.join(output_dir, input_filename)

    if not os.path.exists(yolo_output_path):
        raise FileNotFoundError(f"YOLO output not found at {yolo_output_path}")

    shutil.move(yolo_output_path, final_output_path)

    return predicted_classes


if __name__ == "__main__":
    os.makedirs("saved_images", exist_ok=True)
    os.makedirs("captured_images", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5001)
