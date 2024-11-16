# Discord-GPT
Discord bot powered by Ollama and Whisper. Built with Bun + Python.

## Features

- Chat with AI models through Ollama
- Voice message transcription with Whisper
- Conversation history management
- Fast response times with Bun runtime

## Prerequisites

- Bun
- Python 3.8+
- CUDA Toolkit
- FFmpeg
- Ollama

## Setup

1. Install:
```bash
bun install
cd src/whisper && pip install -r requirements.txt
```

2. Configure `src/config.json`:
```json
{
  "discord": {
    "token": "your-discord-bot-token-here",
    "prefix": "!"
  },
  "llm": {
    "port": 11434,
    "model": "llama3.2"
  },
  "whisper": {
    "port": 8000,
    "model_size": "small",
    "cuda": true
  }
}
```

3. Launch:
```bash
./sh/run.sh
```

## Commands

- `!ask <message>` - Chat with AI
- `!clear` - Reset history
- Send voice message for transcription
