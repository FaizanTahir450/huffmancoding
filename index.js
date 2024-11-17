document.getElementById('back-button').addEventListener('click', function () {
    document.getElementById('nav-layout').style.display = 'block';
    document.getElementById('encoded-text').style.display = 'none';
    document.getElementById('encoded-codes').style.display = 'none';
    document.getElementById('text-layout').style.display = 'none';
    document.getElementById('file-layout').style.display = 'none';
    document.getElementById('image-layout').style.display = 'none';
    document.getElementById('image-input').value = '';
    document.getElementById('file-input').value = '';
    document.getElementById('image-compression-ratio').style.display = 'none';
    document.getElementById('download-encoded-image').style.display = 'none';
    document.getElementById('downloadDecodedLink').style.display = 'none';
   // document.getElementById('originalCanvas').style.display = 'none';
   // document.getElementById('decompressedCanvas').style.display = 'none';
});
document.getElementById('text-encoding-button').addEventListener('click', function () {
    document.getElementById('text-layout').style.display = 'block';
    document.getElementById('file-layout').style.display = 'none';
    document.getElementById('image-layout').style.display = 'none';
    document.getElementById('nav-layout').style.display = 'none';
    document.getElementById('text-input').value = null;
});
document.getElementById('text-encode-button').addEventListener('click', function () {
    document.getElementById('encoded-text').style.display = 'block';
    document.getElementById('encoded-codes').style.display = 'block';

});
document.getElementById('file-upload-button').addEventListener('click', function () {
    document.getElementById('text-layout').style.display = 'none';
    document.getElementById('file-layout').style.display = 'block';
    document.getElementById('image-layout').style.display = 'none';
    document.getElementById('nav-layout').style.display = 'none';
    document.getElementById('file-decode-button').style.display = 'block';
});
document.getElementById('image-compression-button').addEventListener('click', function () {
    document.getElementById('text-layout').style.display = 'none';
    document.getElementById('file-layout').style.display = 'none';
    document.getElementById('image-layout').style.display = 'block';
    document.getElementById('nav-layout').style.display = 'none';
});

document.getElementById('file-encode-button').addEventListener('click', function () {
    document.getElementById('downloadLink').style.display = 'block';
    document.getElementById('compression-ratio').style.display = 'block';
    document.getElementById('downloadDecodedLink').style.display = 'none';

});

document.getElementById('file-decode-button').addEventListener('click', function () {
    document.getElementById('downloadLink').style.display = 'none';
    document.getElementById('compression-ratio').style.display = 'none';
    document.getElementById('downloadDecodedLink').style.display = 'block';
});
document.getElementById('image-encode-button').addEventListener('click', function () {
    document.getElementById('download-encoded-image').style.display = 'block';
    document.getElementById('image-compression-ratio').style.display = 'block';
});
document.getElementById('text-encode-button').addEventListener('click', function () {
    const textInput = document.getElementById('text-input').value;
    encodeText(textInput);
});

class HuffmanNode {
    constructor(char, freq) {
        this.char = char;
        this.freq = freq;
        this.left = null;
        this.right = null;
    }
}

// Step 1: Build frequency table, Huffman tree, and encoding map.
function buildFrequencyTable(text) {
    const freq = {};
    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function buildhuffmanTree2(freqTable) {
    const nodes = Object.entries(freqTable).map(([char, freq]) => new HuffmanNode(char, freq));
    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        const parent = new HuffmanNode(null, left.freq + right.freq);
        parent.left = left;
        parent.right = right;
        nodes.push(parent);
    }
    return nodes[0];
}

function buildHuffmanCodes(tree, path = '', codes = {}) {
    if (tree.char !== null) {
        codes[tree.char] = path;
    } else {
        buildHuffmanCodes(tree.left, path + '0', codes);
        buildHuffmanCodes(tree.right, path + '1', codes);
    }
    return codes;
}

function compressTextToBinary(text, codes) {
    let binaryStr = '';
    for (const char of text) {
        binaryStr += codes[char];
    }

    // Convert binary string to byte array
    const byteArray = [];
    for (let i = 0; i < binaryStr.length; i += 8) {
        const byte = binaryStr.slice(i, i + 8).padEnd(8, '0');
        byteArray.push(parseInt(byte, 2));
    }
    return new Uint8Array(byteArray);
}

// Step 2: Serialize Huffman tree for storing with binary data
function serializeTree(tree) {
    if (!tree) return '';
    if (tree.char) return `1${tree.char}`;
    return `0${serializeTree(tree.left)}${serializeTree(tree.right)}`;
}

// Step 3: Deserialize Huffman tree for decoding
function deserializeTree(data) {
    let index = 0;
    function build() {
        if (data[index] === '1') {
            index += 1;
            return new HuffmanNode(data[index++], 0);
        }
        const node = new HuffmanNode(null, 0);
        index += 1;
        node.left = build();
        node.right = build();
        return node;
    }
    return build();
}


function compressFile() {
    const fileInput = document.getElementById("file-input");
    const downloadLink = document.getElementById("downloadLink");

    if (fileInput.files.length === 0) {
        alert("Please upload a file.");
        return;
    }

    const file = fileInput.files[0];

    // Check if the uploaded file is a .txt or .huff file
    const fileType = file.name.split('.').pop().toLowerCase(); // Get file extension
    if (fileType !== 'txt') {
        alert("Please upload a .txt ");
        document.getElementById('file-input').value = '';
        document.getElementById('compression-ratio').style.display = 'none';
        document.getElementById('downloadLink').style.display = 'none';
        return;
    }

    const reader = new FileReader();
    reader.onload = function () {
        const text = reader.result;
        const freqTable = buildFrequencyTable(text);
        const huffmanTree = buildhuffmanTree2(freqTable);
        const huffmanCodes = buildHuffmanCodes(huffmanTree);

        const binaryData = compressTextToBinary(text, huffmanCodes);
        const serializedTree = serializeTree(huffmanTree);
        const treeData = new TextEncoder().encode(serializedTree + "#");

        displayCompressionInfo(file.size, binaryData.length);

        // Combine tree data and binary compressed data
        const combinedData = new Uint8Array(treeData.length + binaryData.length);
        combinedData.set(treeData);
        combinedData.set(binaryData, treeData.length);

        const blob = new Blob([combinedData], { type: "application/octet-stream" });

        // Show the download button and set up the download functionality
        downloadLink.style.display = "block";  // Show the button
        downloadLink.textContent = "Download Compressed File";

        // When the button is clicked, trigger the download
        downloadLink.onclick = function () {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');  // Create a temporary anchor element
            a.href = url;  // Set the href to the Blob URL
            a.download = "compressed.bin";  // Set the file name
            a.click();  // Simulate the click to start the download
            URL.revokeObjectURL(url);  // Clean up the object URL after download
        };
    };

    reader.readAsText(file);  // Read the file as text
}


// Decode binary file to original text
function decodeBinaryToText(binaryData, tree) {
    let decodedText = '';
    let currentNode = tree;
    for (const bit of binaryData) {
        currentNode = bit === '0' ? currentNode.left : currentNode.right;
        if (currentNode.char) {
            decodedText += currentNode.char;
            currentNode = tree;
        }
    }
    return decodedText;
}

function decompressFile() {
    const fileInput = document.getElementById("file-input");
    const downloadDecodedLink = document.getElementById("downloadDecodedLink");


    if (fileInput.files.length === 0) {
        alert("Please upload a file.");
        return;
    }

    const file = fileInput.files[0];

    // Check if the uploaded file is a .txt or .huff file
    const fileType = file.name.split('.').pop().toLowerCase(); // Get file extension
    if (fileType !== 'bin') {
        alert("Please upload a .bin ");
        document.getElementById('file-input').value = '';
        document.getElementById('compression-ratio').style.display = 'none';
        document.getElementById('downloadLink').style.display = 'none';
        document.getElementById('downloadDecodedLink').style.display = 'none';

        return;
    }

    // const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function () {
        const combinedData = new Uint8Array(reader.result);
        const separatorIndex = combinedData.indexOf(35);  // ASCII code for '#'

        const treeData = new TextDecoder().decode(combinedData.slice(0, separatorIndex));
        const binaryData = combinedData.slice(separatorIndex + 1);

        const huffmanTree = deserializeTree(treeData);

        // Convert binary data to bit string
        let bitString = '';
        for (const byte of binaryData) {
            bitString += byte.toString(2).padStart(8, '0');
        }

        const decodedText = decodeBinaryToText(bitString, huffmanTree);

        const blob = new Blob([decodedText], { type: "text/plain" });

        downloadDecodedLink.style.display = "block";  // Show the button
        downloadDecodedLink.textContent = "Download Decompressed File";

        // When the button is clicked, trigger the download
        downloadDecodedLink.onclick = function () {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');  // Create a temporary anchor element
            a.href = url;  // Set the href to the Blob URL
            a.download = "decompressed.txt";  // Set the file name
            a.click();  // Simulate the click to start the download
            URL.revokeObjectURL(url);  // Clean up the object URL after download
        };
    };
    reader.readAsArrayBuffer(file);
}
function displayCompressionInfo(originalSize, compressedSize) {
    // Make sure the elements exist before trying to update them
    const originalElement = document.getElementById('original');
    const compressedElement = document.getElementById('compressed');
    const compressionRatioElement = document.getElementById('compression-ratio-value');

    if (originalElement && compressedElement && compressionRatioElement) {
        const compressionRatio = ((compressedSize / originalSize) * 100).toFixed(2);

        // Display the compression info
        document.getElementById('compression-ratio').style.display = 'block';
        originalElement.textContent = (originalSize).toFixed(2) + " KB";
        compressedElement.textContent = (compressedSize).toFixed(2) + " KB";
        compressionRatioElement.textContent = compressionRatio + "%";
    } else {
        console.error("Error: One or more required elements are missing in the DOM.");
    }
}


// Function to calculate the frequency of each character in the text
function calculateFrequency(text) {
    const frequency = {};
    for (const char of text) {
        frequency[char] = (frequency[char] || 0) + 1;
    }
    return frequency;
}

// Function to build the Huffman Tree
function buildHuffmanTree(frequency) {
    const heap = Object.keys(frequency).map(char => ({
        char,
        freq: frequency[char],
        left: null,
        right: null
    }));

    // Convert array to a min-heap
    heap.sort((a, b) => a.freq - b.freq);

    while (heap.length > 1) {
        const left = heap.shift();
        const right = heap.shift();

        const newNode = {
            char: null,
            freq: left.freq + right.freq,
            left,
            right
        };

        // Insert the new node back into the heap
        heap.push(newNode);
        heap.sort((a, b) => a.freq - b.freq); // Maintain the min-heap property
    }

    return heap[0]; // The root node of the Huffman tree
}

// Function to generate the Huffman codes from the tree
function generateHuffmanCodes(node, prefix = "", codes = {}) {
    if (node.char !== null) {
        // If it's a leaf node, store the code
        codes[node.char] = prefix;
    } else {
        // Otherwise, recurse on the left and right subtrees
        if (node.left) generateHuffmanCodes(node.left, prefix + "0", codes);
        if (node.right) generateHuffmanCodes(node.right, prefix + "1", codes);
    }
    return codes;
}

// Function to encode text using Huffman coding
function encodeText(text) {
    const frequency = calculateFrequency(text); // Step 1: Calculate frequency of characters
    const huffmanTree = buildHuffmanTree(frequency); // Step 2: Build the Huffman tree
    const huffmanCodes = generateHuffmanCodes(huffmanTree); // Step 3: Generate Huffman codes

    // Step 4: Encode the text using the generated Huffman codes
    let encodedText = "";
    for (const char of text) {
        encodedText += huffmanCodes[char];
    }

    // Log encoded text for debugging
    console.log("Encoded Text:", encodedText);

    // Display the encoded text and Huffman codes in the textarea
    document.getElementById('encoded-text').value = encodedText; // Display the encoded text
    document.getElementById('encoded-codes').value = JSON.stringify(huffmanCodes, null, 2); // Format and display Huffman codes
}


class Node {
    constructor(symbol, freq, left = null, right = null) {
        this.symbol = symbol;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function quantizeColors(data) {
    return data.map(value => Math.floor(value / 64) * 64);
}

// Reverse Quantization by adding 32 (approximation of original values)
function reverseQuantizeColors(data) {
    return data.map(value => value + 32);
}
function divideIntoBlocks(data, blockSize = 4) {
    const blocks = [];
    for (let i = 0; i < data.length; i += blockSize * 4) {
        blocks.push(data.slice(i, i + blockSize * 4).toString());
    }
    return blocks;
}
// Build Huffman Tree from Frequency Map
function buildHuffmanTree2(freqMap) {
    const nodes = Object.entries(freqMap).map(([symbol, freq]) => new Node(symbol, freq));
    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        const newNode = new Node(null, left.freq + right.freq, left, right);
        nodes.push(newNode);
    }
    return nodes[0];
}

// Generate Huffman Codes from Tree
function generateCodes(node, code = "", codes = {}) {
    if (node.symbol !== null) {
        codes[node.symbol] = code;
    } else {
        generateCodes(node.left, code + "0", codes);
        generateCodes(node.right, code + "1", codes);
    }
    return codes;
}

// Invert Huffman Codes for Decoding
function invertCodes(codes) {
    const invertedCodes = {};
    for (const key in codes) {
        invertedCodes[codes[key]] = key;
    }
    return invertedCodes;
}
async function compressImage() {
    console.log('Compress button clicked');
    const uploadInput = document.getElementById('image-input');
    if (!uploadInput.files[0]) return alert("Please select an image.");

    const image = await createImageBitmap(uploadInput.files[0]);
    const canvas = document.getElementById("originalCanvas");
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = Array.from(imgData.data);

    // Step 1: Quantize Colors
    const quantizedData = quantizeColors(pixelData);

    // Step 2: Divide into Blocks
    const blocks = divideIntoBlocks(quantizedData);

    // Step 3: Build Frequency Map for Huffman Encoding
    const freqMap = blocks.reduce((acc, block) => {
        acc[block] = (acc[block] || 0) + 1;
        return acc;
    }, {});

    // Step 4: Huffman Encoding
    const huffmanTree = buildHuffmanTree2(freqMap);
    const huffmanCodes = generateCodes(huffmanTree);
    const encodedData = blocks.map(block => huffmanCodes[block]).join("");

    // Convert binary string to bytes
    const binaryArray = new Uint8Array(Math.ceil(encodedData.length / 8));
    for (let i = 0; i < encodedData.length; i += 8) {
        binaryArray[i / 8] = parseInt(encodedData.slice(i, i + 8).padEnd(8, '0'), 2);
    }

    // Store Huffman tree and encoded data in an ArrayBuffer for download
    const compressedData = { huffmanTree, encodedData };
    displayCompressionStats(pixelData.length, binaryArray.length);
    decompressImage(compressedData);
}
function displayCompressionStats(originalSize, compressedSize) {
    const originalSizeKb = (originalSize/1024).toFixed(2);
    const compressedSizeKb = (compressedSize/1024).toFixed(2);
    const compressionRatio = (100-(compressedSize / originalSize * 100)).toFixed(2);

    document.getElementById('compressed2').textContent = `${compressedSizeKb}kb`;
    document.getElementById('original2').textContent = `${originalSizeKb}kb`;
    document.getElementById('compression-ratio-value2').textContent = `${compressionRatio}%`;
}

function decompressImage(compressedData) {
    // Use the compressedData passed from the compression function
    const { huffmanTree, encodedData } = compressedData;

    // Invert Huffman Codes
    const codes = generateCodes(huffmanTree);
    const invertedCodes = invertCodes(codes);

    // Decode compressed data to blocks
    let buffer = "";
    const blocks = [];
    for (const bit of encodedData) {
        buffer += bit;
        if (invertedCodes[buffer]) {
            blocks.push(invertedCodes[buffer]);
            buffer = "";
        }
    }

    // Reconstruct image data with reversed quantization
    let decompressedData = [];
    blocks.forEach(block => {
        const quantizedBlock = block.split(',').map(Number);
        const originalBlock = reverseQuantizeColors(quantizedBlock);
        decompressedData = decompressedData.concat(originalBlock);
    });

    // Draw decompressed image on canvas
    const canvas = document.getElementById("decompressedCanvas");
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    imgData.data.set(new Uint8ClampedArray(decompressedData));
    ctx.putImageData(imgData, 0, 0);

    // Create downloadable link for decompressed image
    canvas.toBlob((blob) => {
        const link = document.getElementById("download-encoded-image");
        link.href = URL.createObjectURL(blob);
        link.download = "decompressed_image.png";
        link.style.display = "block";
        link.innerText = "Download Decompressed Image";
    });
}






























