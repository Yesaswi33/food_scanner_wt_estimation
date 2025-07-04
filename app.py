from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import uuid
import shutil
import cv2
import numpy as np
from ultralytics import YOLO
from utils.gemini_output import get_gemini_response

app = Flask(__name__)

# Global color map to ensure consistent colors for same classes
color_map = {}



@app.route("/")
def index():
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

        predicted_classes, boxes_info = run_yolo_on_image(capture_path, saved_folder)
        response= get_gemini_response()
        return jsonify(
            {
                "message": "Image uploaded and model run",
                "model_output_filename": filename,
                "predicted_classes": predicted_classes,
                "boxes": boxes_info,
                "gemini_response": response,
            }
        )

    except Exception as e:
        print(e)
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
    # os.makedirs(saved_folder, exist_ok=True)

    capture_path = os.path.join(captured_folder, filename)
    image.save(capture_path)

    try:
        predicted_classes, boxes_info = run_yolo_on_image(capture_path, saved_folder)
        return jsonify(
            {
                "message": "Image captured and model run",
                "model_output_filename": filename,
                "predicted_classes": predicted_classes,
                "boxes": boxes_info,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_color_for_class(class_name):
    """Get consistent color for a class name"""
    global color_map
    if class_name not in color_map:
        # Generate a random color and store it
        color_map[class_name] = (
            np.random.randint(150, 256),
            np.random.randint(175, 256),
            np.random.randint(100, 256),
        )
    return color_map[class_name]


def run_yolo_on_image(input_path, output_dir):
    model_version = "best-so-far.pt"
    model_path = os.path.join("models", model_version)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: models/{model_version}")

    model = YOLO(model_path)
    input_filename = os.path.basename(input_path)
    results = model.predict(source=input_path, save=False)

    image = cv2.imread(input_path)
    height, width = image.shape[:2]
    txt_lines = []
    predicted_classes = []
    boxes_info = []

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            predicted_classes.append(class_name)

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # Get consistent color for this class
            color = get_color_for_class(class_name)

            # Calculate normalized coordinates for YOLO format
            cx = (x1 + x2) / 2 / width
            cy = (y1 + y2) / 2 / height
            bw = (x2 - x1) / width
            bh = (y2 - y1) / height

            # Calculate pixel coordinates for drawing
            center_x_pixel = int((x1 + x2) / 2)
            center_y_pixel = int((y1 + y2) / 2)

            txt_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

            thickness = max(1, (width + height) // 200)
            
            # Draw the bounding box
            thickness = max(2, (width + height) // 300)
            # Draw filled rectangle (with some transparency)
            overlay = image.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)  # -1 fills the rectangle
            alpha = 0.5  # Transparency factor (0.0 - 1.0)
            cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)
            # Draw rectangle border
            cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)
            

            # Draw center dot using pixel coordinates
            cv2.circle(
                image,
                (center_x_pixel, center_y_pixel),
                thickness * 3,
                color,
                -1,
            )  # Filled circle

            # Convert color to hex format for frontend
            # color_hex = "#%02x%02x%02x" % color

            boxes_info.append(
                {
                    "label": class_name,
                    "class_id": class_id,
                    "cx": cx,
                    "cy": cy,
                    "w": bw,
                    "h": bh,
                    "color": color,
                }
            )

    final_output_path = os.path.join(output_dir, input_filename)
    txt_output_path = os.path.splitext(final_output_path)[0] + ".txt"
    cv2.imwrite(final_output_path, image)
    with open(txt_output_path, "w") as f:
        f.write("\n".join(txt_lines))

    # Return unique classes and all boxes info
    return list(set(predicted_classes)), boxes_info


if __name__ == "__main__":
    os.makedirs("saved_images", exist_ok=True)
    os.makedirs("captured_images", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5000)