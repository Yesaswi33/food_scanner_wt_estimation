let stream = null;
let targetDistance = 25; // Target distance in cm
let currentDistance = 0;

async function startCamera() {
    const video = document.getElementById('video');
    const placeholder = document.getElementById('cameraPlaceholder');
    const errorMessage = document.getElementById('errorMessage');
    const distanceIndicator = document.getElementById('distanceIndicator');

    try {
        // Request rear camera specifically
        const constraints = {
            video: {
                facingMode: { exact: "environment" }, // Rear camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        // Hide placeholder and show video
        placeholder.style.display = 'none';
        video.style.display = 'block';
        distanceIndicator.style.display = 'block';
        errorMessage.style.display = 'none';

        // Start distance simulation
        startDistanceSimulation();

    } catch (error) {
        console.error('Error accessing camera:', error);
        let errorText = 'Camera access denied or not available.';

        if (error.name === 'OverconstrainedError') {
            errorText = 'Rear camera not available. Please try on a mobile device.';
        } else if (error.name === 'NotAllowedError') {
            errorText = 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorText = 'No camera found on this device.';
        }

        errorMessage.textContent = errorText;
        errorMessage.style.display = 'block';
    }
}

function startDistanceSimulation() {
    // Simulate distance changes for demonstration
    // In a real app, this would use actual depth sensors or computer vision
    setInterval(() => {
        // Simulate random distance between 15-35 cm
        currentDistance = Math.floor(Math.random() * 20) + 15;
        updateDistanceDisplay();
        updateBorderColor();
    }, 2000);
}

function updateDistanceDisplay() {
    const distanceValue = document.getElementById('distanceValue');
    distanceValue.textContent = currentDistance;
}

function updateBorderColor() {
    const cameraSection = document.getElementById('cameraSection');
    const tolerance = 3; // ±3cm tolerance

    if (Math.abs(currentDistance - targetDistance) <= tolerance) {
        cameraSection.classList.add('optimal-distance');
    } else {
        cameraSection.classList.remove('optimal-distance');
    }
}

// Stop camera when page is closed
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Handle orientation changes on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (stream) {
            const video = document.getElementById('video');
            video.style.transform = 'none';
        }
    }, 500);
});
