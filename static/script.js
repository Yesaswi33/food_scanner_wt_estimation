
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

let userStream = null;
let selectedFile = null;

function showUpload() {
  document.getElementById("uploadSection").style.display = "block";
  document.getElementById("liveSection").style.display = "none";
  document.getElementById("modelOutput").style.display = "none";
  stopVideo();
  resetUploadSection();
}

function showLive() {
  document.getElementById("liveSection").style.display = "block";
  document.getElementById("uploadSection").style.display = "none";
  document.getElementById("modelOutput").style.display = "none";
  startVideo();
}

function resetUploadSection() {
  selectedFile = null;
  document.getElementById("previewContainer").style.display = "none";
  document.getElementById("uploadBtn").style.display = "none";
  document.getElementById("processing").style.display = "none";
  document.getElementById("statusMessage").style.display = "none";
  document.getElementById("uploadInput").value = "";
}

async function startVideo() {
  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'environment'
    }
  };
  try {
    userStream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById('userVideo').srcObject = userStream;
  } catch (err) {
    showStatus('Camera access denied or unavailable: ' + err.message, 'error');
  }
}

function stopVideo() {
  if (userStream) {
    userStream.getTracks().forEach(track => track.stop());
    userStream = null;
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

function showProcessing(show) {
  document.getElementById('processing').style.display = show ? 'block' : 'none';
}

function handleFileSelect(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showStatus('Please select a valid image file', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    showStatus('File size too large. Please select an image under 10MB', 'error');
    return;
  }

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = function (e) {
    const preview = document.getElementById('previewImage');
    preview.src = e.target.result;
    document.getElementById('previewContainer').style.display = 'flex';
    document.getElementById('uploadBtn').style.display = 'inline-block';

    // Show file info
    const fileInfo = document.getElementById('fileInfo');
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeKB = (file.size / 1024).toFixed(1);
    fileInfo.innerHTML = `
        <div><strong>📄 ${file.name}</strong></div>
        <div>📏 Size: ${sizeMB} MB (${sizeKB} KB) </div>
         <div>📅 Type: ${file.type} </div>
      `;
  };
  reader.readAsDataURL(file);
}

async function handleLiveCapture() {
  const video = document.getElementById('userVideo');
  if (!video.videoWidth || !video.videoHeight) {
    showStatus('Camera not ready. Please wait a moment and try again.', 'error');
    return;
  }

  showProcessing(true);

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async function (blob) {
    try {
      const formData = new FormData();
      formData.append('image', blob, 'live_capture.png');

      const response = await fetch('/infer_image', {
        method: 'POST',
        body: formData
      });

      // const data = await response.json();
      // showProcessing(false);

      // if (response.ok) {
      //   updateModelOutput(data.model_output_filename, data.boxes);
      //   displayClasses(data.predicted_classes, data.boxes);
      //   showStatus('Food analysis completed successfully!', 'success');
      // } else {
      //   showStatus('Analysis failed: ' + (data.error || 'Unknown error'), 'error');
      // }
    } catch (error) {
      showProcessing(false);
      showStatus('Network error. Please check your connection.', 'error');
    }
  }, 'image/png');
}

async function uploadImage(selectedFile) {
  if (!selectedFile) {
    showStatus('Please select an image first', 'error');
    return;
  }

  showProcessing(true);

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
    showProcessing(false);
    showStatus('Network error. Please check your connection.', 'error');
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

// Click to select file
dropZone.addEventListener('click', () => fileInput.click());

// File input change handler
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropZone.classList.add('dragover');
}

function unhighlight(e) {
  dropZone.classList.remove('dragover');
}

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
}

// Clipboard paste functionality
document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        // Show upload section if not already visible
        if (document.getElementById("uploadSection").style.display === "none") {
          showUpload();
        }
        handleFileSelect(blob);
        showStatus('Image pasted from clipboard!', 'success');
      }
      break;
    }
  }
});

// Initialize with upload section hidden
document.getElementById("uploadSection").style.display = "none";
document.getElementById("liveSection").style.display = "none";

