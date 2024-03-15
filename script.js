const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
  const selectedInput = document.querySelector('input[name="inputType"]:checked');
  const inputType = selectedInput.value;

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // load the model and metadata
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  if (inputType === 'webcam') {
    // Iniciar webcam e processar imagem ...
    //startWebcam(); // Função para iniciar a webcam

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
      labelContainer.appendChild(document.createElement("div"));
    }
  } else if (inputType === 'image') {
    const imageSelector = document.getElementById('image-selector');

    // Verificar se há uma imagem selecionada
    if (imageSelector.files.length > 0) {
      const reader = new FileReader();
      reader.onload = async function(e) {
        const image = new Image();
        image.src = e.target.result;
        image.onload = async function() {
          // Pre-processe a imagem aqui (redimensione, normalize, etc.)
          const imageTensor = cv2.resize(image, (224, 224)); // Assuming OpenCV.js (cv2) for pre-processing
          const imageTensor4D = tf.expandDims(imageTensor, 0); // Expand dimension for model input

          // Predição da imagem
          const predictResult = await model.predict(imageTensor4D);

          // Exibir resultados na tela
          for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = predictResult[i].className + ": " + predictResult[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction; 
          }
        };
      };
      reader.readAsDataURL(imageSelector.files[0]);
    } else {
      console.error('Nenhuma imagem selecionada.');
    }
  } else {
    console.error('Tipo de entrada inválido:', inputType);
  }
}

// Função para lidar com a mudança de tipo de entrada (webcam/imagem)
function handleInputTypeChange() {
  const selectedInput = document.querySelector('input[name="inputType"]:checked');
  const inputType = selectedInput.value;

  if (inputType === 'webcam') {
    document.getElementById('image-upload').style.display = 'none';
  } else if (inputType === 'image') {
    document.getElementById('image-upload').style.display = 'block';
  }
}

// Função para o loop da webcam (não inclusa)
async function loop() {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}

// (Supondo que você tenha uma função predict() para processar a imagem da webcam)
async function predict() {
  // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
}
