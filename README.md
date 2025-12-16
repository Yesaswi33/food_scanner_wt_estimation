


https://github.com/user-attachments/assets/2793898a-6ef8-4bf5-a60c-17d9941a9ffb





## Food Scanner App – Developer Guide

### Overview

The **Food Scanner App** is a web-based application that allows users to **upload or capture food images**, run **local object detection using a custom-trained YOLO model**, and visualize detected food items with **bounding boxes and interactive HTML labels**.

In addition, the app provides **AI-powered food suggestions** using the **Hugging Face Inference API**, making it a complete platform for food recognition, nutrition insights, and intelligent recommendations.

> The YOLO model runs fully **locally**, ensuring privacy and low latency, while AI suggestions are fetched via a **free Hugging Face API**.

---

## Features

* Upload food images via:

  * File picker
  * Drag-and-drop
  * Webcam capture
  * Clipboard paste
* Local food detection using a **custom YOLO model**
* No external inference services for object detection
* Interactive visualization:

  * Bounding boxes
  * Colored dots
  * Pointer lines
  * HTML labels
* AI-powered food suggestions (nutrition facts, recipes, insights)
* Responsive and user-friendly UI

---

## Project Structure

```
food-scanner/
│
├── models/
│   └── food_recognition_model_v2.pt
│
├── utils/
│   └── run_yolo.py
│
├── static/
│   ├── script.js
│   ├── style.css
│
├── templates/
│   └── output.html
│
├── video_app.py
├── requirements.txt
├── .env
└── README.md
```

---

## Setup & Installation

### 1. Fork and Clone Repository

```bash
git clone https://github.com/yourusername/food-scanner.git
cd food-scanner
```

---

### 2. Install Python Dependencies

It is recommended to use a virtual environment.

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

---

### 3. Place YOLO Model

Download your custom-trained YOLO model (e.g., `food_recognition_model_v2.pt`)
and place it inside the `models/` directory.

---

## Environment Variables & API Keys

### Hugging Face API (Free Access)

To keep API keys secure, create a `.env` file in the project root.

**Sample `.env`**

```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

**Usage**

* The Hugging Face API is used for **AI-generated food suggestions**
* Loaded inside `video_app.py` using `os.environ` or `python-dotenv`

> Hugging Face API is used instead of Gemini due to free-tier accessibility.

---

## Usage

1. Start the backend:

```bash
python video_app.py
```

2. Open browser:

```
http://localhost:5000
```

3. Upload an image using:

   * Drag-and-drop
   * File picker
   * Webcam capture
   * Clipboard paste

4. Wait for inference:

   * YOLO model runs locally
   * Food items are detected and visualized

5. View results:

   * Bounding boxes over detected food
   * Labels shown outside the image
   * AI-generated suggestions displayed below

---

## How It Works

### Frontend (HTML / JavaScript)

* Handles image input
* Sends image to backend
* Renders:

  * Bounding boxes (canvas)
  * Colored dots (HTML)
  * Pointer lines and labels
* Displays Hugging Face AI suggestions for the entire meal/photo

---

### Backend (Flask / Python)

* Receives uploaded images
* Runs YOLO inference locally using Ultralytics
* Extracts detected food classes and bounding boxes
* Sends detected food list to Hugging Face API
* Renders results in `output.html`

---

### Visualization

Each detected item includes:

* Bounding box overlay
* Colored dot at center
* Pointer line connecting to label
* Styled HTML label matching the dot color

AI suggestions appear in a dedicated section below the image.

---

## Key Code Highlights

### 1. Local YOLO Inference

`utils/run_yolo.py`

* Loads custom YOLO model
* Runs inference locally
* Parses bounding boxes and class names

---

### 2. Hugging Face AI Suggestions

`video_app.py`

* Sends detected food names to Hugging Face inference API
* Receives nutrition facts, recipes, and insights
* Displays suggestions in `output.html`

---

### 3. Interactive Labels

`static/script.js`

* Draws bounding boxes
* Places dots and labels dynamically
* Ensures responsive positioning

---

## Key Libraries Used

* **Flask** – Backend web framework
* **Ultralytics** – Local YOLO inference
* **OpenCV (cv2)** – Image processing
* **Hugging Face Inference API** – AI suggestions
* **python-dotenv** – Environment variable loading
* **Requests** – HTTP communication
* **Pillow** – Image handling

---

## Customization

* **Change YOLO Model**

  * Replace model file inside `models/`
* **Adjust Label Styling**

  * Modify `static/script.js` or `style.css`
* **Extend AI Suggestions**

  * Update prompt logic sent to Hugging Face API

---

## Troubleshooting

### Network Errors

* Ensure backend is running
* Check correct localhost port

### No Detections

* Verify YOLO model path
* Check parsing logic in `run_yolo.py`

### AI Suggestions Not Showing

* Confirm Hugging Face API key
* Check API response logs

### UI Issues

* Ensure static files are loading
* Check browser console for JS errors

---

## Limitations

* Model detects only trained food classes
* Mixed or rare dishes may be misclassified
* Poor lighting or cluttered backgrounds reduce accuracy
* Multiple food items in one image may affect detection

---

## Tips for Better Accuracy

* Maintain 25–30 cm camera distance
* Use top-view angle
* Ensure good lighting
* Keep background simple
* Avoid multiple food items in one image

---

## Contact & Support

For queries or support:

* Email: [madabattulayesaswi@gmail.com](mailto:_____@gmail.com)
* Phone: 9494138821

---

## Summary

The **Food Scanner App** combines **local YOLO-based food detection** with **AI-powered suggestions via Hugging Face**, delivering a privacy-friendly, extensible, and intelligent food recognition platform suitable for real-world use.
