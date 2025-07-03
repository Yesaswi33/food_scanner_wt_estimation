# video_app.py
from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import uuid
import shutil
import cv2
import numpy as np
from ultralytics import YOLO

app = Flask(__name__)


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

        return jsonify(
            {
                "message": "Image uploaded and model run",
                "model_output_filename": filename,
                "predicted_classes": predicted_classes,
                "boxes": boxes_info,
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
    os.makedirs(saved_folder, exist_ok=True)

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


def get_random_color():
    return (
        np.random.randint(0, 256),
        np.random.randint(0, 256),
        np.random.randint(0, 256),
    )


# def run_yolo_on_image(input_path, output_dir):
#     model_version = "best-so-far.pt"
#     model_path = os.path.join("models", model_version)
#     if not os.path.exists(model_path):
#         raise FileNotFoundError(f"Model file not found: models/{model_version}")

#     model = YOLO(model_path)
#     input_filename = os.path.basename(input_path)
#     results = model.predict(source=input_path, save=False)

#     image = cv2.imread(input_path)
#     height, width = image.shape[:2]
#     txt_lines = []
#     predicted_classes = []
#     boxes_info = []

#     for result in results:
#         if result.boxes is None:
#             continue
#         for box in result.boxes:
#             class_id = int(box.cls[0])
#             class_name = model.names[class_id]
#             predicted_classes.append(class_name)

#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             color = get_random_color()
#             color_hex = "#%02x%02x%02x" % color
#             cx = (x1 + x2) / 2 / width
#             cy = (y1 + y2) / 2 / height
#             bw = (x2 - x1) / width
#             bh = (y2 - y1) / height
#             txt_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

#             cv2.rectangle(image, (x1, y1), (x2, y2), color, 3)
#             cv2.putText(
#                 image,
#                 class_name,
#                 (x1, y1 - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.75,
#                 color,
#                 2,
#             )
#             cv2.circle(image, (int(cx), int(cy)), 10, color, 2)
#             boxes_info.append(
#                 {
#                     "label": class_name,
#                     "class_id": class_id,
#                     "cx": cx,
#                     "cy": cy,
#                     "w": bw,
#                     "h": bh,
#                     "color": color_hex,
#                 }
#             )

#     final_output_path = os.path.join(output_dir, input_filename)
#     txt_output_path = os.path.splitext(final_output_path)[0] + ".txt"
#     cv2.imwrite(final_output_path, image)
#     with open(txt_output_path, "w") as f:
#         f.write("\n".join(txt_lines))

#     return list(set(predicted_classes)), boxes_info


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
            
            # if predicted_classes[class_name] is None:
            #     predicted_classes[class_name] = get_random_color()
            
            color = get_random_color()

            # Calculate normalized coordinates for YOLO format
            cx = (x1 + x2) / 2 / width
            cy = (y1 + y2) / 2 / height
            bw = (x2 - x1) / width
            bh = (y2 - y1) / height

            # Calculate pixel coordinates for drawing
            center_x_pixel = int((x1 + x2) / 2)
            center_y_pixel = int((y1 + y2) / 2)

            txt_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

            # Draw bounding box
            # cv2.rectangle(image, (x1, y1), (x2, y2), color, 3)

            # Draw class label
            # cv2.putText(
            #     image,
            #     class_name,
            #     (x1, y1 - 10),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.75,
            #     color_map[class_name],
            #     2,
            # )

            thickness = (width // height) * 10

            # Draw center dot using pixel coordinates
            cv2.circle(
                image,
                (center_x_pixel, center_y_pixel),
                thickness,
                color,
                -10,
            )  # Filled circle
            # cv2.circle(
            #     image, (center_x_pixel, center_y_pixel), 5, (255, 255, 255), 2
            # )  # White border

            boxes_info.append(
                {
                    "label": class_name,
                    "class_id": class_id,
                    "cx": cx,
                    "cy": cy,
                    "w": bw,
                    "h": bh,
                    "color": color,  # Use the color from the map
                }
            )

    final_output_path = os.path.join(output_dir, input_filename)
    txt_output_path = os.path.splitext(final_output_path)[0] + ".txt"
    cv2.imwrite(final_output_path, image)
    with open(txt_output_path, "w") as f:
        f.write("\n".join(txt_lines))

    return list(set(predicted_classes)), boxes_info


if __name__ == "__main__":
    os.makedirs("saved_images", exist_ok=True)
    os.makedirs("captured_images", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5001)
