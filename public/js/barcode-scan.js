import Quagga from "https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js";

const result = document.getElementById("barcodeResult");

Quagga.init({
  inputStream: {
    name: "Live",
    type: "LiveStream",
    target: document.querySelector("#video")
  },
  decoder: {
    readers: ["code_128_reader"]
  }
}, () => Quagga.start());

Quagga.onDetected(data => {
  result.innerText = data.codeResult.code;
  sessionStorage.setItem("barcode", data.codeResult.code);
  Quagga.stop();
});
