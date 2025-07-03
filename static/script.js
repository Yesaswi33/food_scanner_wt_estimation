
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
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('uploadBtn').style.display = 'inline-block';

        // Show file info
        const fileInfo = document.getElementById('fileInfo');
        const sizeKB = (file.size / 1024).toFixed(1);
        fileInfo.innerHTML = `
        <strong>📄 ${file.name}</strong><br>
        📏 Size: ${sizeKB} KB<br>
        📅 Type: ${file.type}
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

          const response = await fetch('/capture_user_image_and_infer', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          showProcessing(false);

          if (response.ok) {
            updateModelOutput(data.model_output_filename, data.boxes);
            displayClasses(data.predicted_classes, data.boxes);
            showStatus('Food analysis completed successfully!', 'success');
          } else {
            showStatus('Analysis failed: ' + (data.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          showProcessing(false);
          showStatus('Network error. Please check your connection.', 'error');
        }
      }, 'image/png');
    }

    async function uploadImage() {
      if (!selectedFile) {
        showStatus('Please select an image first', 'error');
        return;
      }

      showProcessing(true);

      try {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const response = await fetch("/upload_and_infer_image", {
          method: "POST",
          body: formData
        });

        const data = await response.json();
        showProcessing(false);

        if (response.ok) {
          updateModelOutput(data.model_output_filename, data.boxes);
          displayClasses(data.predicted_classes, data.boxes);
          showStatus('Food analysis completed successfully!', 'success');
        } else {
          showStatus('Upload failed: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        showProcessing(false);
        showStatus('Network error. Please check your connection.', 'error');
      }
    }

    function displayClasses(classes, boxes) {
      const predictedClassesElement = document.getElementById("predictedClasses");
      predictedClassesElement.innerHTML = "";

      if (!classes || classes.length === 0) {
        predictedClassesElement.innerHTML = "<li class='error'>❌ No food items detected</li>";
        return;
      }

      if (boxes && boxes.length > 0) {
        boxes.forEach((box, index) => {
          const li = document.createElement("li");
          const [b, g, r] = box.color;
          li.textContent = `${index + 1}. ${box.label}`;
          li.style.animationDelay = `${index * 0.1}s`;
        //   li.style.background = box.color;
        //   li.style.color = '#222';
          li.style.color = `rgb(${r}, ${g}, ${b})`;
          predictedClassesElement.appendChild(li);
        });
      } else {
        classes.forEach((classLabel, index) => {
          const li = document.createElement("li");
          li.textContent = `${classLabel}`;
          li.style.animationDelay = `${index * 0.1}s`;
          predictedClassesElement.appendChild(li);
        });
      }
    }

    let lastBoxes = [];
    function updateModelOutput(filename, boxes) {
      const output = document.getElementById("modelOutputImage");
      output.src = "/saved_images/" + filename + "?t=" + Date.now();
      document.getElementById("modelOutput").style.display = "block";
      lastBoxes = boxes || [];
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("modelOutput").scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
      drawBoundingBoxesAndLabels(lastBoxes);
    }

    // Draw bounding boxes, center dots, and external labels with color
    function drawBoundingBoxesAndLabels(boxes) {
      const img = document.getElementById('modelOutputImage');
      const canvas = document.getElementById('bboxOverlay');
      const labelsDiv = document.getElementById('bboxLabels');
      if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => drawBoundingBoxesAndLabels(boxes);
        return;
      }
      // Set overlay sizes
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.width = img.width + 'px';
      canvas.style.height = img.height + 'px';
      labelsDiv.style.width = img.width + 'px';
      labelsDiv.style.height = img.height + 'px';
      // Clear previous
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      labelsDiv.innerHTML = '';
      boxes.forEach((box, i) => {
        // Convert normalized to pixel coordinates
        const x = (box.cx - box.w / 2) * img.width;
        const y = (box.cy - box.h / 2) * img.height;
        const w = box.w * img.width;
        const h = box.h * img.height;
        const cx = box.cx * img.width;
        const cy = box.cy * img.height;
        const [hue, sat, lum] = box.color;
        // Draw bounding box
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // Draw line from center to label edge
        const labelX = (i % 2 === 0) ? img.width + 20 : -120;
        const labelY = cy - 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(labelX < 0 ? 0 : img.width, cy);
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Add label as absolutely positioned div
        const labelDiv = document.createElement('div');
        labelDiv.textContent = box.label;
        labelDiv.style.position = 'absolute';
        labelDiv.style.left = (labelX < 0 ? labelX + img.width : labelX) + 'px';
        labelDiv.style.top = labelY + 'px';
        // labelDiv.style.background = box.color;
        // labelDiv.style.color = '#222';
        labelDiv.style.color = `hsl(${hue}, ${sat}%, ${lum}%)`;
        labelDiv.style.padding = '.25rem .5rem';
        labelDiv.style.borderRadius = '.25rem';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.fontSize = '15px';
        labelDiv.style.pointerEvents = 'none';
        labelsDiv.appendChild(labelDiv);
        // Add HTML dot with serial number at center
        const dotDiv = document.createElement('div');
        dotDiv.textContent = (i + 1).toString();
        dotDiv.style.position = 'absolute';
        dotDiv.style.left = (cx - 14) + 'px';
        dotDiv.style.top = (cy - 14) + 'px';
        dotDiv.style.width = '28px';
        dotDiv.style.height = '28px';
        dotDiv.style.background = box.color;
        dotDiv.style.color = '#222'; // Always readable text color
        dotDiv.style.borderRadius = '50%';
        dotDiv.style.display = 'flex';
        dotDiv.style.alignItems = 'center';
        dotDiv.style.justifyContent = 'center';
        dotDiv.style.fontWeight = 'bold';
        dotDiv.style.fontSize = '16px';
        dotDiv.style.pointerEvents = 'none';
        dotDiv.style.zIndex = '10';
        labelsDiv.appendChild(dotDiv);
      });
    }

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
  