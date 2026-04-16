# ASV — A Silent Voice: Technical Development Guide

This document provides every single detail required to build the ASV (A Silent Voice) project from scratch. ASV is a non-invasive, EMG-based silent speech interface that translates internal muscle movements into real-time speech.

---

## 1. System Architecture
The system follows a 10-stage signal pipeline across three main layers:
- **Hardware Layer**: Signal acquisition and pre-processing.
- **Firmware Layer (ESP32)**: Real-time windowing and on-device ML inference.
- **Application Layer**: BLE communication and Text-to-Speech (TTS) synthesis.

---

## 2. Hardware Requirements (BOM)
To build the prototype from scratch, you need:

| Component | Specification | Purpose |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (Dual Core) | Main processing and Bluetooth LE. |
| **EMG Sensor** | AD8232 or MyoWare 2.0 | Muscle activity detection. |
| **ADC** | ADS1115 (16-bit) | Precision analog-to-digital conversion. |
| **Amplifier** | INA128 | Differential signal amplification (1000x). |
| **Electrodes** | Ag/AgCl disposable gel pads | Skin contact points. |
| **Power** | 3.7V 2000mAh Li-Po + TP4056 | Portable power and USB-C charging. |
| **Display** | 0.96" SSD1306 OLED | On-device status and output. |

---

## 3. Joining Components (Hardware Assembly)
Follow this wiring logic to integrate the hardware:

1.  **EMG Placement**:
    - **Channel 1 (Masseter-L)**: Placed on the left jaw muscle.
    - **Channel 2 (Masseter-R)**: Placed on the right jaw muscle.
    - **Channel 3 (Suprahyoid)**: Placed under the chin (tongue movement).
    - **GND (Reference)**: Placed behind the ear or on the throat.
2.  **Signal Chain**:
    - EMG Sensors → **INA128** (Signal Amplification) → **ADS1115** (Conversion) → **ESP32** (I2C: SDA/SCL).
3.  **Power**:
    - Battery → **TP4056** → **ESP32 (Vin)**. OLED connected to 3.3V and I2C lines.

---

## 4. The Dataset
The dataset is the core of "The ML". For ASV, the dataset consists of multi-channel EMG time-series data.

- **Sample Shape**: `[Batch, Time_Steps, Channels]`.
- **Channels**: 3 (Masseter Left, Masseter Right, Suprahyoid).
- **Sampling Rate**: 1000Hz (1 sample every 1ms).
- **Training Corpus**: 50 core words recorded in "Silent Speech" mode (mouthing without sound).
- **Scale**: 20 speakers, 30 repetitions per word (approx. 30,000 labeled segments per language).
- **Key Insight**: Includes retroflex phonemes (like Hindi *ट/ड* and Kannada *ಳ*) which require suprahyoid tongue curling, providing distinct EMG signatures.

---

## 5. The ML Pipeline (Signal to Speech)

### Phase 1: Pre-processing (On-Device)
1.  **Bandpass Filter**: 20–500 Hz (Butterworth 4th order) to remove noise.
2.  **Notch Filter**: 50 Hz (rejects Indian power line noise).
3.  **Envelope Detection**: Rectification + 20ms Moving Average.
4.  **Feature Extraction**: Calculates MAV, RMS, Zero-Crossing Rate, and 13 MFCCs.

### Phase 2: Classification (The Model)
The project utilizes a **CNN-LSTM Hybrid** architecture:
- **CNN Layers**: Extract spatial features from the 3-channel EMG windows.
- **LSTM Layers**: Process the temporal sequence of muscle activation.
- **Softmax Output**: Classifies the window into one of the 50+ vocab words.
- **Confidence Threshold**: 0.75 (returns "unclear" if below).

---

## 6. Model Integration & Deployment

### Training Implementation:
```python
# Conceptual Keras Model
model = Sequential([
    Conv1D(64, kernel_size=3, activation='relu', input_shape=(200, 3)),
    MaxPooling1D(pool_size=2),
    LSTM(128, return_sequences=False),
    Dense(64, activation='relu'),
    Dense(VOCAB_SIZE, activation='softmax')
])

Integration Steps:
Convert to TFLite: Use tf.lite.TFLiteConverter to optimize the model for microcontrollers.
ESP32 Deployment: Use TensorFlow Lite for Microcontrollers.
BLE Stream: The ESP32 sends the classified word string via BLE GATT protocol to the connected app.
TTS Integration: The Android/Desktop app receives the text and triggers the native Speech Engine.
7. How to Build (Step-by-Step)
Setup Environment: Install Arduino IDE (with ESP32 board manager) and Python (for ML training).
Hardware Breadboard: Connect ADS1115 and EMG sensors to ESP32.
Data Collection: Run the data_collector.py script to record EMG signals while mouthing specific words.
Train Model: Train the CNN-LSTM on the collected CSV data.
Compile Firmware: Flash the ESP32 with the TFLite model and BLE server code.
Connect App: Open the ASV Flutter app, pair via BLE, and start "speaking" silently.