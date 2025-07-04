// Starfield animation
const field = document.getElementById('starfield');
const numStars = 200;
for (let i = 0; i < numStars; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  const size = Math.random() * 3 + 1;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.animationDelay = `${Math.random() * 3}s`;
  field.appendChild(star);
}

// === Global Variables ===
let userStream = null;
let selectedFile = null;

// === UI Toggle ===
function showUpload() {
  document.getElementById("uploadSection").style.display = "block";
  document.getElementById("liveSection").style.display = "none";
  stopVideo();
  resetUploadSection();
}

function showLive() {
  document.getElementById("uploadSection").style.display = "none";
  document.getElementById("liveSection").style.display = "block";
  startVideo();
}

// === Upload Reset ===
function resetUploadSection() {
  selectedFile = null;
  document.getElementById("previewContainer").style.display = "none";
  document.getElementById("uploadBtn").style.display = "none";
  document.getElementById("statusMessage").style.display = "none";
  document.getElementById("uploadInput").value = "";
}

// === Video Stream ===
async function startVideo() {
  try {
    userStream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("userVideo").srcObject = userStream;
  } catch (err) {
    showStatus("Camera access denied: " + err, "error");
  }
}

function stopVideo() {
  if (userStream) {
    userStream.getTracks().forEach(track => track.stop());
    userStream = null;
  }
}

// === Status Message ===
function showStatus(message, type = "info") {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = "block";
}

// === Processing Spinner Placeholder (optional)
function showProcessing(show) {
  // Optional: add loading spinner logic
}

// === File Preview + Upload Button ===
function handleFileSelect(file) {
  if (!file || !file.type.startsWith("image/")) {
    showStatus("❌ Please select a valid image file", "error");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showStatus("❌ File too large. Max 10MB allowed.", "error");
    return;
  }

  selectedFile = file;
  const reader = new FileReader();

  reader.onload = function (e) {
    document.getElementById("previewImage").src = e.target.result;
    document.getElementById("previewContainer").style.display = "flex";
    document.getElementById("uploadBtn").style.display = "inline-block";

    document.getElementById("fileInfo").innerHTML = `
      <div><strong>📄 ${file.name}</strong></div>
      <div>📏 Size: ${(file.size / 1024).toFixed(1)} KB</div>
      <div>🧾 Type: ${file.type}</div>
    `;
  };

  reader.readAsDataURL(file);
}

  if (!selectedFile) {
    showStatus("Please select an image first", "error");
    return;
  }

  const formData = new FormData();
  formData.append("image", selectedFile);

  try {
    const formData = new FormData();
    formData.append("image", selectedFile);
    const response = await fetch("/infer_image", {
      method: "POST",
      body: formData
    });

    // const data = await response.json();
    // showProcessing(false);

    // if (response.ok) {
    //   updateModelOutput(data.model_output_filename, data.boxes);
    //   displayClasses(data.predicted_classes, data.boxes);
    //   showStatus('Food analysis completed successfully!', 'success');
    // } else {
    //   showStatus('Upload failed: ' + (data.error || 'Unknown error'), 'error');
    // }
  } catch (error) {
    showStatus("❌ Server error: " + error, "error");
  }
}


// function displayClasses(classes, boxes) {
//   const predictedClassesElement = document.getElementById("predictedClasses");
//   predictedClassesElement.innerHTML = "";

//   if (!classes || classes.length === 0) {
//     predictedClassesElement.innerHTML = "<li class='error'>❌ No food items detected</li>";
//     return;
//   }

//   // Create a map to get the first occurrence of each class with its color
//   const classColorMap = {};
//   if (boxes && boxes.length > 0) {
//     boxes.forEach(box => {
//       if (!classColorMap[box.label]) {
//         const [b, g, r] = box.color;
//         console.log(box.color);

//         // classColorMap[box.label] = box.color;
//         classColorMap[box.label] = `rgb(${r}, ${g}, ${b})`; // Use RGB format for CSS
//       }
//     });
//   }

//   // Display only unique classes
//   classes.forEach((classLabel, index) => {
//     const li = document.createElement("li");
//     li.textContent = `${index + 1}. ${classLabel}`;
//     li.style.animationDelay = `${index * 0.1}s`;

//     // Use the color from the map if available
//     if (classColorMap[classLabel]) {
//       li.style.color = classColorMap[classLabel];
//       console.log("Li Styling" + li.style.color);
//     } else {
//       console.log("Li Styling not found for " + classLabel);

//     }

//     predictedClassesElement.appendChild(li);
//   });
// }

// let lastBoxes = [];
// function updateModelOutput(filename, boxes) {
//   const output = document.getElementById("modelOutputImage");
//   output.src = "/saved_images/" + filename + "?t=" + Date.now();
//   document.getElementById("modelOutput").style.display = "block";
//   lastBoxes = boxes || [];
//   // Smooth scroll to results
//   setTimeout(() => {
//     document.getElementById("modelOutput").scrollIntoView({
//       behavior: 'smooth',
//       block: 'center'
//     });
//   }, 100);
//   drawBoundingBoxesAndLabels(lastBoxes);
// }


// Enhanced Drag and Drop functionality




const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('uploadInput');

dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
});

["dragenter", "dragover", "dragleave", "drop"].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
  });
});

["dragenter", "dragover"].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.add("dragover"))
);

["dragleave", "drop"].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove("dragover"))
);

dropZone.addEventListener("drop", (e) => {
  if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
});

// === Clipboard Paste Support ===
document.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith("image")) {
      const blob = items[i].getAsFile();
      if (blob) {
        showUpload();
        handleFileSelect(blob);
        showStatus("📋 Image pasted from clipboard!", "success");
      }
    }
  }
});

// === Hide Upload/Live Sections by Default ===
document.getElementById("uploadSection").style.display = "none";
document.getElementById("liveSection").style.display = "none";
