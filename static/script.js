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

function handleClick (e) {
  console.log("clicked");
  e.target.disabled = true;
}

// === Upload Button ===
// This function is no longer needed as HTML <form> handles upload via submit
// but if you keep the upload button, you can allow manual trigger like below
function uploadImage() {
  document.querySelector("#uploadSection form").submit();
}

// === Live Capture Handler ===
async function handleLiveCapture() {
  const video = document.getElementById("userVideo");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    const file = new File([blob], "live_capture.png", { type: "image/png" });

    // Fill hidden input in live form
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById("liveImageInput");
    input.files = dt.files;

    // Submit form
    document.getElementById("liveCaptureForm").submit();
  }, "image/png");
}

// === Drag & Drop Setup ===
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("uploadInput");

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
