"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const initSkynet_1 = require("./initSkynet");
const init_1 = require("@decloudlabs/sky-ai-accesspoint/lib/init");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generative_ai_1 = require("@google/generative-ai");
const speech_1 = require("@google-cloud/speech");
const speech_2 = require("@google-cloud/speech");
const text_to_speech_1 = require("@google-cloud/text-to-speech");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '50mb' }));
const port = process.env.PORT || 3000;
const tempDir = path_1.default.join(__dirname, 'temp');
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Initialize Google Cloud clients
const speechClient = new speech_1.SpeechClient();
const textToSpeechClient = new text_to_speech_1.TextToSpeechClient();
// Configure multer for handling file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});
const validatePodParams = (params, action) => {
    switch (action) {
        case "file":
            const requiredParams = ["action"];
            return requiredParams.every((param) => params.hasOwnProperty(param) && params[param] !== null);
        case "text":
            const requiredTextParams = ["action", "text"];
            return requiredTextParams.every((param) => params.hasOwnProperty(param) && params[param] !== null);
        case "audio-to-text":
            const requiredAudioParams = ["action"];
            return requiredAudioParams.every((param) => params.hasOwnProperty(param) && params[param] !== null);
        case "text-to-speech":
            const requiredSpeechParams = ["action", "text", "voice"];
            return requiredSpeechParams.every((param) => params.hasOwnProperty(param) && params[param] !== null);
        default:
            throw new Error("Invalid action");
    }
};
// Audio transcription cost (using Google Speech-to-Text pricing as reference)
const calculateTranscriptionCost = (durationSeconds) => {
    // Cost per minute of audio (approx)
    const costPerMinute = 0.004 * 1e12;
    return (durationSeconds / 60) * costPerMinute;
};
// Text-to-speech cost (using Google Text-to-Speech pricing as reference)
const calculateTTSCost = (characterCount) => {
    // Cost per 1000 characters (approx)
    const costPer1000Chars = 0.0075 * 1e12;
    return (characterCount / 1000) * costPer1000Chars;
};
// Function to get audio duration
const getAudioDuration = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    // This is a simplified approach - in a production environment,
    // you would want to use a library like ffprobe
    // For now, we'll estimate based on file size (very rough estimate)
    const stats = fs_1.default.statSync(filePath);
    const fileSizeInBytes = stats.size;
    // Rough estimate: 16kHz mono audio is about 32KB per second
    return fileSizeInBytes / 32000;
});
// Save text to a file
const saveTextToFile = (text, filename) => {
    const filePath = path_1.default.join(tempDir, filename);
    fs_1.default.writeFileSync(filePath, text);
    return filePath;
};
// Save buffer to a file
const saveBufferToFile = (buffer, filename) => {
    const filePath = path_1.default.join(tempDir, filename);
    fs_1.default.writeFileSync(filePath, buffer);
    return filePath;
};
const runNaturalFunction = (req, res, balanceRunMain) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("received request");
        const { prompt, accountNFT } = req.body;
        console.log("accountNFT: ", accountNFT);
        console.log("Files:", req.files); // Debug log
        console.log("prompt", prompt);
        // Use Gemini model for understanding the request
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const chatSession = geminiModel.startChat({
            generationConfig: {
                temperature: 0.2,
            },
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `You are a helpful assistant tasked with extracting parameters for audio operations. Audio files are already uploaded, so do not prompt the user to upload them again. Always ask for specific parameters, without making assumptions.
        If you're uncertain about any parameters, ask for clarification.
        Return a JSON object structured as follows:
        - For file storage:
        {
          "action": "file",
          "name" : "name for the file. Generate one based on the user input if not directly provided."
        }
        - For text storage:
        {
          "action": "text",
          "text": "text to save",
          "name": "name for the file, required if not provided pass empty string"
        }
        - For audio transcription (voice to text):
        {
          "action": "audio-to-text",
          "language": "optional language code (e.g., 'en-US', 'fr-FR', 'es-ES') or null"
        }
        - For text to speech:
        {
          "action": "text-to-speech",
          "text": "text to convert to speech",
          "voice": "voice to use (en-US-Standard-A through en-US-Standard-I, or locale specific voices)"
        }`,
                        },
                    ],
                },
                {
                    role: "model",
                    parts: [
                        {
                            text: "I understand. I'll extract parameters according to your guidelines and return a JSON object in the specified format based on the user's request.",
                        },
                    ],
                },
            ],
        });
        const result = yield chatSession.sendMessage(prompt);
        const responseText = result.response.text();
        // Extract JSON from response
        let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
            responseText.match(/\{[\s\S]*\}/);
        let params;
        if (jsonMatch) {
            try {
                params = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            catch (e) {
                console.error("Error parsing JSON from Gemini response:", e);
                res.status(400).json({
                    success: false,
                    error: "Failed to parse parameters from AI response",
                });
                return;
            }
        }
        else {
            res.status(400).json({
                success: false,
                error: "AI response did not contain valid JSON parameters",
            });
            return;
        }
        console.log("params: ", params);
        if (params.question) {
            res.send({ success: false, message: params.question });
            return;
        }
        if (!validatePodParams(params, params.action) && params.question) {
            res.send({
                error: `Invalid parameters, missing parameters : ${Object.keys(params)
                    .filter((key) => !["action", "question"].includes(key) && params[key] === null)
                    .join(", ")}`,
            });
            return;
        }
        let filePath;
        let cost = 0;
        switch (params.action) {
            case "file":
                // No action needed, files are already saved to temp directory by multer
                if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: "No files were uploaded",
                    });
                    return;
                }
                // Get file paths from multer
                const filePaths = req.files.map(file => file.path);
                res.json({
                    success: true,
                    message: `Files saved successfully`,
                    filePaths: filePaths,
                });
                break;
            case "text":
                // Save text to a file
                filePath = saveTextToFile(params.text, params.name || `text-${Date.now()}.txt`);
                res.json({
                    success: true,
                    message: "Text saved successfully",
                    filePath: filePath,
                });
                break;
            case "audio-to-text":
                // Check if audio file exists before processing
                if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: "No audio file was uploaded",
                    });
                    return;
                }
                const audioFile = req.files[0];
                if (!audioFile || !audioFile.path) {
                    throw new Error("Audio file path is missing");
                }
                // Estimate duration for cost calculation
                const estimatedDuration = yield getAudioDuration(audioFile.path);
                // Read file for Speech-to-Text
                const audioContent = fs_1.default.readFileSync(audioFile.path).toString('base64');
                const audio = {
                    content: audioContent,
                };
                const AudioEncoding = speech_2.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;
                const config = {
                    encoding: AudioEncoding.LINEAR16,
                    sampleRateHertz: 16000,
                    languageCode: params.language || 'en-US',
                };
                const speechRequest = {
                    audio: audio,
                    config: config,
                };
                // Transcribe audio using Google Speech-to-Text
                const [transcriptionResponse] = yield speechClient.recognize(speechRequest);
                const transcription = ((_a = transcriptionResponse.results) === null || _a === void 0 ? void 0 : _a.map(result => { var _a, _b; return ((_b = (_a = result.alternatives) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript) || ''; }).join('\n')) || '';
                // Save transcription to a file
                const transcriptionFilePath = saveTextToFile(transcription, `transcription-${Date.now()}.txt`);
                // Calculate and add transcription cost
                const transcriptionCost = calculateTranscriptionCost(estimatedDuration);
                console.log("Transcription cost:", transcriptionCost);
                cost += transcriptionCost;
                res.json({
                    success: true,
                    message: "Audio transcribed successfully",
                    transcription: transcription,
                    transcriptionFilePath: transcriptionFilePath,
                });
                break;
            case "text-to-speech":
                // Google Text-to-Speech configuration
                // Create properly typed request
                const ttsRequest = {
                    input: { text: params.text },
                    voice: {
                        languageCode: params.voice.split('-').slice(0, 2).join('-') || 'en-US',
                        name: params.voice || 'en-US-Standard-A',
                    },
                    audioConfig: {
                        audioEncoding: text_to_speech_1.protos.google.cloud.texttospeech.v1.AudioEncoding.MP3
                    },
                };
                // Process response with proper null/undefined handling
                const [ttsResponse] = yield textToSpeechClient.synthesizeSpeech(ttsRequest);
                if (!ttsResponse.audioContent) {
                    throw new Error("Failed to generate audio content");
                }
                const audioBuffer = Buffer.from(ttsResponse.audioContent);
                // Calculate and add TTS cost
                const ttsCost = calculateTTSCost(params.text.length);
                console.log("Text-to-speech cost:", ttsCost);
                cost += ttsCost;
                // Save the generated speech audio to a file
                const speechFilePath = saveBufferToFile(audioBuffer, `speech-${Date.now()}.mp3`);
                res.json({
                    success: true,
                    message: "Text converted to speech successfully",
                    speechFilePath: speechFilePath,
                });
                break;
            default:
                throw new Error("Invalid action");
        }
        console.log("Total cost:", cost);
        if (cost > 0) {
            balanceRunMain.addCost(accountNFT, cost.toFixed(0).toString());
        }
    }
    catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to process request",
        });
    }
});
app.use('/temp', express_1.default.static(tempDir));
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    const skyNode = yield (0, initSkynet_1.getSkyNode)();
    const env = {
        JSON_RPC_PROVIDER: process.env.PROVIDER_RPC,
        WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
        SUBNET_ID: process.env.SUBNET_ID,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        SERVER_COST_CONTRACT_ADDRESS: process.env.SERVER_COST_CONTRACT_ADDRESS
    };
    const balanceRunMain = yield (0, init_1.initAIAccessPoint)(env, skyNode, app, runNaturalFunction, true, upload);
    if (!balanceRunMain.success) {
        console.error("Error initializing AI Access Point:", balanceRunMain);
        process.exit(1);
    }
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});
setup().catch(console.error);
