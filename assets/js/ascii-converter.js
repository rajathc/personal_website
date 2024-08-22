// Handle image upload
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        convertToAscii(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Convert image to ASCII
  function convertToAscii(imageData) {
    // Ensure asciify.js is loaded
    if (typeof asciify === 'undefined') {
      console.error('Asciify library is not loaded.');
      return;
    }
    
    asciify(imageData, { fit: 'box', width: 100, height: 50 }, (err, asciified) => {
      if (err) {
        console.error('Error converting image to ASCII:', err);
        return;
      }
      document.getElementById('ascii-output').innerHTML = `<pre>${asciified}</pre>`;
      document.getElementById('download').style.display = 'block';
    });
  }
  
  // Handle download button click
  document.getElementById('download').addEventListener('click', () => {
    const asciiArt = document.getElementById('ascii-output').innerText;
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ascii-art.txt';
    link.click();
  });
  