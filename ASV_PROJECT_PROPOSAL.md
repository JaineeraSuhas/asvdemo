# PROJECT PROPOSAL: ASV – A SILENT VOICE

**1. Project Title:** ASV – A SILENT VOICE  
**2. Branch:** Information Science and Engineering  
**Sem & Sec:** 6th and C  

**3. Theme (Technical Domain):** Artificial Intelligence / Internet of Medical Things (IoMT) / Human-Computer Interaction  

**4. Relevance/Sector-**  
5. Information Technology / 4. Health / 7. Societal  

**5. Name(s) of project guide(s):**  
1. **Name:** Dr. Mahesh T N / Prof. Sonia S B / Omprakash B / Dr. Deepak N R *(Select applicable guide)*
   **Designation:** [Designation]  
   **Email id:** [Guide Email]  
   **Contact No.:** [Guide Contact]  

**6. Name of Team Members:**  
*(Note: Type names in Capital Letters as provided in your college)*

1. **Name:** [MEMBER 1 NAME]  
   **USN No.:** [MEMBER 1 USN]  
   **Email id:** [Email] **Mobile No:** [Phone]  
2. **Name:** [MEMBER 2 NAME]  
   **USN No.:** [MEMBER 2 USN]  
   **Email id:** [Email] **Mobile No:** [Phone]  
3. **Name:** [MEMBER 3 NAME]  
   **USN No.:** [MEMBER 3 USN]  
   **Email id:** [Email] **Mobile No:** [Phone]  
4. **Name:** [MEMBER 4 NAME] *(Optional)*  
   **USN No.:** [MEMBER 4 USN]  
   **Email id:** [Email] **Mobile No:** [Phone]  

**7. Team Leader of the Project:**  
**Name:** [LEADER NAME]  
**USN No.:** [LEADER USN]  
**Email id:** [Email] **Mobile No:** [Phone]  

**8. Date of commencement of the Project:** [Start Date, e.g., March 2026]  

**9. Probable date of completion of the project:**  
**Project Phase 1:** [E.g., June 2026]  
**Major Project Phase 2:** [E.g., May 2027]  

**10. Probable date of paper publication:**  
**Phase 1 – Survey paper:** [E.g., July 2026]  
**Phase 2 – Implementation paper:** [E.g., April 2027]  

---

**11. Abstract of the project:**  
ASV (A Silent Voice) is a non-invasive, wearable sub-vocal speech recognition system that translates silent jaw, facial, and throat muscle micro-movements into synthesized speech and text. Millions globally suffer from voice loss due to conditions like ALS, vocal cord paralysis, or laryngectomy. ASV restores their ability to communicate by intercepting neural signals before vocalization occurs. The physical wearable uses medical-grade Ag/AgCl electrodes placed on the masseter and suprahyoid muscles, connected to an ESP32 microcontroller and a high-precision 16-bit ADS1115 ADC. The edge hardware acquires Surface Electromyography (sEMG) biosignals, filters electrical noise using an INA128 instrumentation amplifier, and transmits the time-series data over Bluetooth Low Energy (BLE). A powerful Deep Learning pipeline—incorporating CNN-LSTM architectures—decodes these sequential temporal patterns into phonemes and full sentences in real-time (<500ms latency), outputting fluid speech to a companion mobile array.

**12. Objectives of the project:**  
• Develop an ergonomic, non-invasive wearable capable of capturing dual-channel sEMG data from the masseter and suprahyoid muscles.  
• Implement a real-time signal acquisition and noise-reduction hardware pipeline utilizing the ESP32, INA128, and a 16-bit ADC for precision recording.  
• Curate and preprocess a localized dataset of sub-vocalized words and multilingual phonemes (including Hindi/Kannada variations).  
• Design and train a high-accuracy sequence-to-sequence deep learning model (CNN-LSTM) to convert raw signal bursts into text and synthesized speech.  
• Achieve a continuous-use architecture with <500ms end-to-end latency for fluid conversation.  

**13. Methodology of work:**  
*Step 1: Hardware Assembly & Biosignal Acquisition* 
- Interfacing Ag/AgCl electrodes with the INA128 instrumentation amplifier to isolate differential signals.
- Digitization using the ADS1115 (16-bit ADC) and transmission to PC/Phone via ESP32 BLE.
*Step 2: Signal Processing & Dataset Generation*
- Applying bandpass (20-450Hz) and Notch filters (50Hz) to remove AC noise and baseline wander.
- Collecting categorized datasets of English and Multilingual (Hindi/Kannada) phonetic target gestures.
*Step 3: Neural Network Training*
- Extracting temporal features using Mel-frequency cepstral coefficients (MFCCs) adapted for EMG.
- Training a 1D-CNN + LSTM network to decode sequential temporal muscle activations into linguistic tokens.
*Step 4: Edge Deployment & UI Integration*
- Streaming the interpreted tokens to the ASV Web/App companion dashboard for TTS (Text-to-Speech) output.

**14. Technology Stack**  
**Programming Language:** Python (ML/Data), C++ (ESP32 Firmware), JavaScript/HTML/CSS (Frontend UI).  
**Frameworks:** TensorFlow / Keras (Deep Learning), React / Vanilla Web (Dashboard).  
**Hardware:** ESP32 WROOM-32, ADS1115 16-bit ADC, INA128 Amplifier.  
**Database:** Firebase (User Profiles & Model Weights) / MongoDB.  
**Cloud Services:** AWS (for large-scale dataset training), Firebase Hosting.  

**15. Expected Outcome of the project:**  
• A fully functional prototype strap-on wearable that reliably reads sub-vocalized commands.  
• A companion software interface that converts those signals to audible speech and on-screen text in real time.  
• A foundational implementation supporting Multilingual sub-vocal recognition, an SOS emergency interrupt clench detection, and a high-contrast Minimalist Monochrome visual interface.  

**16. Can the product or process developed in the project be taken up for filing a Patent?**  
**Yes** / No  
**Prior Art search done?** **Yes** / No  
*(Note: Consult IPR Coordinator Dr Jyoti Metan).*

**17. Budget details (Max budget 15K):**  

| Budget (particulars) | Amount (INR) | 
| :--- | :--- |
| ESP32 Microcontroller & Dev Boards | ₹ 800 |
| ADS1115 16-Bit ADC Modules | ₹ 650 |
| INA128 Instrumentation Amplifiers & PCB Fab | ₹ 1,500 |
| Biomedical Ag/AgCl Electrodes & Wires | ₹ 500 |
| LiPo 2000mAh Battery & USB-C TP4056 | ₹ 450 |
| 3D Printed Enclosure & Silicone Strap | ₹ 1,200 |
| **Total** | **₹ 5,100** |

**18. Pert chart for completion of the project:**  
* Month 1: Literature Survey, Component Procurement & Feasibility Study.  
* Month 2: Base Circuit Design, Breadboard testing (ESP32 + ADC).  
* Month 3: Designing Custom PCB, 3D printing housing.  
* Month 4: Software Pipeline Development, Signal filtering scripts (Python).  
* Month 5: Dataset Collection (Sub-vocalizing 50+ basic words).  
* Month 6: Deep Learning model training, tuning hyperparameters.  
* Month 7: Integration of Hardware + Cloud + UI, achieving <500ms latency.  
* Month 8: Final Testing, Multilingual tuning, and Report formulation.  

**19. Specify Relevance to PO/PSO (Refer Annexure A):**  
• **PO1 (Engineering Knowledge):** Applying signal processing mathematics and algorithms to raw biological voltages.  
• **PO2 (Problem Analysis):** Formulating a programmatic approach to translate stochastic bio-electrical noise into structured linguistic data.  
• **PO3 (Design/development of solutions):** Designing a compact hardware module and robust software architecture ensuring public health safety (non-invasive).  
• **PO5 (Modern tool usage):** Utilizing deep learning frameworks (TensorFlow), cloud infrastructure, and 3D modeling tools.  
• **PO6 (The engineer and society):** Addressing a severe societal health constraint (voice loss/aphasia) with assistive tech.  
• **PSO1:** Analyzing and designing a complete AI-driven data structure pipeline to achieve optimal temporal inference performance.  
• **PSO2:** Managing and processing new streams of biomedical data utilizing deep learning, bridging the gap between embedded hardware and real-world web/mobile applications.  

**20. Reference:**  
1. *Base Paper:* Kapur, A., Kapur, S., & Maes, P. (2018). "AlterEgo: A Personalized Wearable Silent Speech Interface." *23rd International Conference on Intelligent User Interfaces*. DOI: 10.1145/3172944.3172977  
2. Meltzner, G. S., et al. (2017). "Development and evaluation of a sEMG-based silent speech interface." *Speech Communication*.  
3. Schultz, T., et al. (2017). "Biosignal-Based Spoken Communication: A Survey." *IEEE/ACM Transactions on Audio, Speech, and Language Processing*.  
4. Zhang, X., et al. (2020). "Deep Learning for Electromyographic Hand Gesture Recognition: A Review." *IEEE Reviews in Biomedical Engineering*.  
5. Jou, S. C., et al. (2006). "Towards a continuous phonetic vocoder for a silent speech interface." *ICSLP*.  
6. Ahsan, M. R., et al. (2009). "EMG signal classification for human computer interaction: A review." *European Journal of Scientific Research*.  

**21. Project Coordinator:**  
**Name:** [Coordinator Name]  
**Email id:** [Coordinator Email]  
**Contact No.:** [Coordinator Contact]  
