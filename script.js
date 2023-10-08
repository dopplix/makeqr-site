document.addEventListener('DOMContentLoaded', function () {
    const optionButtons = document.querySelectorAll('.option-button');

    const qrcodeContainer = document.getElementById('qrcode');
    const generateButton = document.getElementById('generate-button');
    const downloadButton = document.getElementById('download-button');

    const sizeSelect = document.getElementById('size-select');

    let qrcode = null;
    let imageSize = null;

    function init() {
        imageSize = parseInt(sizeSelect.value, 10);
        hideAllInputContainers();
        document.getElementById(`link-input-container`).style.display = 'block';
        document.getElementById(`link-input-container`)
        generateQRCode("text", "sample");
    }

    function hideAllInputContainers() {
        const inputContainers = document.querySelectorAll('.input-container');
        inputContainers.forEach((container) => {
            container.style.display = 'none';
        });
    }

    optionButtons.forEach((button) => {
        button.addEventListener('click', function () {
            hideAllInputContainers();
            const option = button.getAttribute('data-option');
            const inputContainer = document.getElementById(`${option}-input-container`);
            inputContainer.style.display = 'block';

            optionButtons.forEach((btn) => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });


    function clearQRCode() {
        if (qrcode != null) {
            qrcode.clear();
            qrcode = null;
            qrcodeContainer.innerHTML = '';
        }
    }

    function generateQRCode(type, value) {
        clearQRCode();
        console.log(type, value);
        console.log(qrcode);
        qrcode = new QRCode(qrcodeContainer, {
            text: type === 'link' || type === 'text' ? value : '',
            tel: type === 'call' ? value : '',
            email: type === 'email' ? value : '',
            width: imageSize,
            height: imageSize
        });
    }

    sizeSelect.addEventListener('change', function () {
        imageSize = parseInt(sizeSelect.value, 10);
    });

    generateButton.addEventListener('click', function () {
        const selectedOptionButton = document.querySelector('.option-button.active');
        if (selectedOptionButton) {
            const option = selectedOptionButton.getAttribute('data-option');
            const input = document.getElementById(`${option}-input`).value;
            if (input) {
                generateQRCode(option, input);
            }
        }
    });

    downloadButton.addEventListener('click', function () {
        if (qrcode) {
            const qrImage = qrcodeContainer.querySelector('img');
            if (qrImage) {
                const a = document.createElement('a');
                a.href = qrImage.src;
                a.download = `qrcode_${imageSize}px.png`;
                a.click();
            }
        }
    });

    // page init 
    init();
});
