# 🧠 AI Audio Assistant Server Accesspoint

This is an Express + TypeScript-based server application that allows users to interact with advanced AI audio tools powered by Google Cloud APIs and Decloud Labs' SkyNet. It handles file uploads, audio transcription, text-to-speech synthesis, and intelligent prompt parsing using Google's Generative AI (Gemini).

## 🚀 Features

- ✅ File Upload and Plain Text Storage
- 🎙️ Audio-to-Text Transcription via Google Speech-to-Text
- 🔊 Text-to-Speech Synthesis using Google Text-to-Speech
- 🤖 Intelligent Prompt Parsing via Gemini AI
- 💸 Real-time Cost Estimation and Blockchain Logging (SkyNet)
- ⚡ Temporary File Handling with UUID & Safe Storage
- 🌐 Easy-to-use REST API with `/temp` route for file access

## 📁 Project Structure

```
.
├── temp/                  # Temporary directory for storing files
├── src/
│   ├── initSkynet.ts      # Initializes SkyNet blockchain interface
│   ├── index.ts           # Main Express server with all endpoints
├── .env                   # Contains all secure environment variables
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-audio-assistant.git
cd ai-audio-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
PORT=3000
GOOGLE_API_KEY=your_google_generative_ai_key
PROVIDER_RPC=your_rpc_url
WALLET_PRIVATE_KEY=your_private_key
SUBNET_ID=subnet_id
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
OPENAI_API_KEY=your_openai_key_if_needed
SERVER_COST_CONTRACT_ADDRESS=your_contract_address
```

⚠️ **Important**: Wrap FIREBASE_PRIVATE_KEY in double quotes if it contains newline characters.

### 4. Run the Server

```bash
npm run dev
```

Visit the server on: http://localhost:3000

## 🧪 API Usage

### 📌 POST /

Main endpoint that takes a prompt, userId, and optional files to process based on the AI's interpretation.

Example JSON Input:

```json
{
  "prompt": "Convert this MP3 to text",
  "userId": "user_abc123"
}
```

### AI Response Interpretation:

The Gemini model processes the prompt and determines the task:

- **file**: Save uploaded files
- **text**: Save provided text into a file
- **audio-to-text**: Transcribe MP3 file to text
- **text-to-speech**: Convert text into MP3 audio

### 🔄 File Upload

Use `multipart/form-data` with `files` as the field name. You can upload one or more files.

### 📂 Temporary File Access

Uploaded/processed files are stored temporarily and accessible via:

```
GET http://localhost:3000/temp/<filename>
```

## 💸 Cost Estimation Logic

| Operation | Rate |
|-----------|------|
| Audio Transcription | $0.004 per minute of audio |
| Text-to-Speech | $0.0075 per 1,000 characters |

Costs are estimated in picodollars and logged using `BalanceRunMain.addCost()` on Decloud SkyNet's blockchain.

## 🛠️ Technologies Used

- **Node.js + TypeScript**
- **Express.js** for the server
- **Google APIs**
  - Generative AI (Gemini)
  - Speech-to-Text
  - Text-to-Speech
- **Decloud Labs**
  - sky-ai-accesspoint
  - skynet
- **Multer** for file handling
- **uuid** for unique file naming
- **dotenv** for environment config

## 📦 NPM Dependencies

```json
{
  "express": "^4.x",
  "multer": "^1.x",
  "uuid": "^9.x",
  "@google/generative-ai": "^0.x",
  "@google-cloud/speech": "^5.x",
  "@google-cloud/text-to-speech": "^4.x",
  "@decloudlabs/skynet": "^1.x",
  "@decloudlabs/sky-ai-accesspoint": "^1.x",
  "dotenv": "^10.x",
  "body-parser": "^1.x",
  "cors": "^2.x"
}
```

## 🧩 Environment Variables Cheat Sheet

| Variable Name | Description |
|---------------|-------------|
| PORT | Port the server runs on |
| GOOGLE_API_KEY | Key for Google Gemini AI |
| PROVIDER_RPC | RPC endpoint for blockchain connection |
| WALLET_PRIVATE_KEY | Private key for blockchain wallet |
| SUBNET_ID | Subnet ID for Decloud blockchain |
| FIREBASE_PROJECT_ID | Firebase project ID |
| FIREBASE_CLIENT_EMAIL | Firebase service account email |
| FIREBASE_PRIVATE_KEY | Firebase private key |
| OPENAI_API_KEY (optional) | If using OpenAI for fallback/alternative AI |
| SERVER_COST_CONTRACT_ADDRESS | Contract address for logging costs |

## 🔐 Security Considerations

- API keys and wallet credentials are never hardcoded
- Uses `.env` for secrets
- AI interprets user intent, reducing manual input errors
- Files auto-named using uuid to prevent conflicts

## 📜 License

MIT License © 2025