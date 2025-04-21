# Audio Access Point Frontend

This is the frontend interface for the Audio Access Point service, providing a user-friendly way to interact with audio processing capabilities, including:

- Speech-to-Text transcription
- Text-to-Speech conversion
- Audio file storage
- Text storage

## Features

### Audio to Text
Upload audio files and convert spoken words to text with support for multiple languages.

### Text to Speech
Convert text to natural-sounding speech with various voice options.

### File Storage
Securely store audio files for later use.

### Text Storage
Save text content for future reference.

## Usage

1. Make sure the backend server is running
2. Navigate to the application URL in your web browser
3. Select one of the four available features
4. Fill out the required information in the form
5. Submit the form to process your request
6. View and download the results

## Technical Details

The frontend is built with:
- HTML5
- CSS3
- JavaScript (ES6+)

It communicates with the backend API to process audio and text data.

## API Endpoints

The frontend interacts with the following API endpoints:

- `POST /run-function`: Main endpoint for all operations
- `GET /temp/{filename}`: Access to processed files

## Authentication

All API requests require an Account NFT to be provided.

## Getting Started

To run the application:

1. Ensure you have Node.js installed
2. Install dependencies with `npm install`
3. Start the server with `npm start`
4. Access the application at `http://localhost:3000`

## Dependencies

- Modern web browser with JavaScript enabled
- Backend server running and accessible
- Valid Account NFT for API access 