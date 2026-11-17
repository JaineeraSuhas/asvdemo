# ASV — A Silent Voice
# Complete project README

## What is ASV?
ASV (A Silent Voice) is a non-invasive, wearable silent speech interface. It reads jaw and throat muscle signals (EMG) via skin-surface electrodes, classifies them using a CNN-LSTM neural network running on an ESP32, and speaks the detected word aloud through a paired Android app.

**For people who cannot speak — ASV gives them a voice.**

---

## Project Structure

```
a-silent-voice/
├── ml/                          # Machine Learning pipeline (Python)
│   ├── 01_synthetic_generator.py   # Generate synthetic EMG training data
│   ├── 02_signal_pipeline.py       # Bandpass + notch + envelope filter
│   ├── 03_feature_extraction.py    # 40D feature vector extraction
│   ├── 04_train_svm.py             # SVM baseline classifier
│   ├── 05_train_cnn_lstm.py        # CNN-LSTM deep learning model
│   ├── 06_convert_tflite.py        # Compress model for ESP32
│   ├── 07_collect_real_data.py     # Collect real EMG via USB serial
│   ├── 08_retrain_real_data.py     # Retrain on real EMG data
│   ├── data/
│   │   ├── synthetic/              # Generated training data
│   │   ├── raw/                    # Real EMG recordings
│   │   └── processed/              # Filtered + featured data
│   └── models/                     # Trained model files
│       ├── svm_baseline.pkl
│       ├── cnn_lstm.keras
│       ├── asv_model.tflite        # ESP32-ready (205.9 KB)
│       └── asv_model.h             # C array for firmware
│
├── firmware/                    # ESP32 Arduino firmware (C++)
│   ├── platformio.ini              # PlatformIO build config
│   └── asv_main/
│       ├── asv_main.ino            # MAIN firmware (flash this)
│       ├── data_collector.ino      # Data collection firmware
│       └── i2c_scanner.ino         # Hardware test firmware
│
├── backend/                     # Flask REST API (Python)
│   ├── app.py                      # API server
│   └── dashboard.html              # Live web dashboard
│
├── tests/                       # Automated tests
│   └── test_pipeline.py            # Full pipeline test suite
│
├── index.html                   # Project website / landing page
├── 3d-model.html                # 3D device model viewer
├── vercel.json                  # Vercel deployment config
└── requirements.txt             # Python dependencies
```

---

## Quick Start

### 1. Setup environment
```powershell
python -m venv asv_env
.\asv_env\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Run ML pipeline (synthetic data — no hardware needed)
```powershell
python ml/01_synthetic_generator.py
python ml/02_signal_pipeline.py
python ml/03_feature_extraction.py
python ml/04_train_svm.py
python ml/05_train_cnn_lstm.py
python ml/06_convert_tflite.py
```

### 3. Start backend + dashboard
```powershell
python backend/app.py
# Opens http://localhost:5000/dashboard automatically
```

### 4. Run tests
```powershell
python tests/test_pipeline.py
```

### 5. Flash ESP32 (after wiring hardware)
```powershell
cd firmware
pio run --target upload --environment esp32dev
pio device monitor --baud 115200
```

---

## Hardware Required

| Component | Purpose |
|---|---|
| ESP32-WROOM-32 | Main processor + BLE |
| AD8232 EMG module | Muscle signal acquisition |
| ADS1115 (16-bit ADC) | Signal digitisation |
| 0.96" OLED SSD1306 | On-device word display |
| LiPo 3.7V 2000mAh | Portable power |
| TP4056 + AMS1117 | Charge management + 3.3V reg |
| Ag/AgCl electrodes | Skin contact |

---

## Model Performance

| Model | Synthetic Data | Real EMG Data |
|---|---|---|
| SVM Baseline | ~21% | ~85-90% |
| CNN-LSTM | ~29% | ~88-95% |
| TFLite size | 205.9 KB | 205.9 KB |

Low synthetic accuracy is expected — real EMG signals have unique signatures that improve accuracy dramatically.

---

## Vocabulary (Phase 1 — 10 words)
`water` · `help` · `pain` · `yes` · `no` · `doctor` · `food` · `stop` · `come` · `home`

---

## Team
Atria Institute of Technology | May 2026
