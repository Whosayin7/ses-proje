/**
 * Replicates the logic of:
 * 1. Taking audio data
 * 2. Performing FFT
 * 3. Filtering 100-4000Hz
 * 4. Downsampling to M=64
 * 5. Normalizing to 0-255
 */
export const generateKeyFromAudioBuffer = (
  audioBuffer: AudioBuffer,
  M: number = 64,
  lowerFreq: number = 100,
  upperFreq: number = 4000
): number[] => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel (Mono)
  const sampleRate = audioBuffer.sampleRate;

  // We need a power of 2 for FFT. Let's take a significant slice of the audio.
  // If audio is long, we take a slice from the middle to represent the 'texture' of the sound.
  const fftSize = 4096;

  let processingSlice: Float32Array;

  if (channelData.length < fftSize) {
    // Pad with zeros if too short
    processingSlice = new Float32Array(fftSize);
    processingSlice.set(channelData);
  } else {
    // Take the middle slice for better representation
    const midPoint = Math.floor(channelData.length / 2);
    const start = Math.max(0, midPoint - fftSize / 2);
    processingSlice = channelData.slice(start, start + fftSize);
  }

  // Windowing function (Hanning) to reduce spectral leakage
  for (let i = 0; i < fftSize; i++) {
    const multiplier = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    processingSlice[i] = processingSlice[i] * multiplier;
  }

  // Perform Real FFT
  const magnitudes = performSimpleFFT(processingSlice);

  // Map FFT bins to frequencies
  // Bin index i corresponds to freq = i * sampleRate / fftSize
  const freqResolution = sampleRate / fftSize;

  const validMagnitudes: number[] = [];

  for (let i = 0; i < magnitudes.length; i++) {
    const freq = i * freqResolution;
    if (freq >= lowerFreq && freq <= upperFreq) {
      validMagnitudes.push(magnitudes[i]);
    }
    if (freq > upperFreq) break;
  }

  if (validMagnitudes.length === 0) {
    // Fallback if no audio in range (silence)
    return new Array(M).fill(0);
  }

  // Downsample to M points
  const key: number[] = [];
  const step = (validMagnitudes.length - 1) / (M - 1);

  for (let i = 0; i < M; i++) {
    const index = Math.round(i * step);
    // Boundary check
    const safeIndex = Math.min(index, validMagnitudes.length - 1);
    key.push(validMagnitudes[safeIndex]);
  }

  // Normalize to 0-255
  const maxVal = Math.max(...key);

  if (maxVal === 0) {
    return key.map(() => 0);
  }

  return key.map((val) => Math.floor((val / maxVal) * 255));
};

/**
 * A simplified FFT implementation for real-valued signals.
 * Returns only the magnitude spectrum (first half).
 */
const performSimpleFFT = (inputReal: Float32Array): Float32Array => {
  const n = inputReal.length;
  // bit reversal not strictly necessary for just magnitude if we use a slower DFT,
  // but let's use a basic O(N^2) DFT for simplicity since N=4096 is small enough for modern JS engines (approx 16m ops)
  // Or better, a slightly optimized Discrete Fourier Transform logic.

  // Since we only need magnitude and N is small-ish, direct summation is robust and dependency-free.
  // Ideally, we'd use a split-radix FFT, but for this specific "key generation" task, strict mathematical precision
  // matches the Python `numpy.fft` better if we use a proper FFT structure.

  // Let's use the Web Audio API's native implementation via OfflineAudioContext for true speed and correctness
  // This avoids writing a slow JS FFT.
  // Note: Since we can't use async here easily inside a sync helper, we assume the caller handles async audio decoding.
  // BUT: The math logic requested strictly needs array manipulation.

  // Let's implement a basic Cooley-Tukey FFT (iterative)
  const m = Math.log2(n);
  if (n !== 1 << m) throw new Error("FFT size must be power of 2");

  // Bit reversal
  const rex = new Float32Array(n);
  const imx = new Float32Array(n);

  // Copy input
  for (let i = 0; i < n; i++) {
    rex[i] = inputReal[i];
    imx[i] = 0;
  }

  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tr = rex[i];
      rex[i] = rex[j];
      rex[j] = tr;
      const ti = imx[i];
      imx[i] = imx[j];
      imx[j] = ti;
    }
    let k = n / 2;
    while (k <= j) {
      j -= k;
      k /= 2;
    }
    j += k;
  }

  // Butterfly
  for (let l = 1; l <= m; l++) {
    const le = 1 << l;
    const le2 = le / 2;
    const ur = 1.0;
    const ui = 0.0;
    // Calculate Sine & Cosine for this stage
    // We can precompute this, but calculating on fly is fine for 4096
    const sr = Math.cos(Math.PI / le2);
    const si = -Math.sin(Math.PI / le2);

    let curR = ur;
    let curI = ui;

    for (let j = 1; j <= le2; j++) {
      for (let i = j - 1; i < n; i += le) {
        const ip = i + le2;
        const tr = rex[ip] * curR - imx[ip] * curI;
        const ti = rex[ip] * curI + imx[ip] * curR;

        rex[ip] = rex[i] - tr;
        imx[ip] = imx[i] - ti;
        rex[i] = rex[i] + tr;
        imx[i] = imx[i] + ti;
      }
      const tmpR = curR;
      curR = tmpR * sr - curI * si;
      curI = tmpR * si + curI * sr;
    }
  }

  // Calculate Magnitude (only first N/2 + 1 needed for real input)
  const magnitudes = new Float32Array(n / 2 + 1);
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = Math.sqrt(rex[i] * rex[i] + imx[i] * imx[i]);
  }

  return magnitudes;
};
