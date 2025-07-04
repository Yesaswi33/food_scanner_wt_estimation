
import os
from ultralytics import YOLO
import cv2
import numpy as np


color_map={}
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
    print("====================")
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
            # cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)  # -1 fills the rectangle
            # alpha = 0.5  # Transparency factor (0.0 - 1.0)
            # cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)
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

