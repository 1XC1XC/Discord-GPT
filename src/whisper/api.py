from fastapi import FastAPI, HTTPException
from faster_whisper import WhisperModel
import aiohttp
import asyncio
import uvicorn
import json
import os


class WhisperTranscriptionService:
    def __init__(self, config_path):
        with open(config_path, "r") as f:
            self.config = json.load(f)

        self.model = self._initialize_model()
        self.temp_dir = "temp_audio"
        os.makedirs(self.temp_dir, exist_ok=True)

    def _initialize_model(self):
        device = "cuda" if self.config["whisper"]["cuda"] else "cpu"
        return WhisperModel(
            self.config["whisper"]["model_size"],
            device=device,
            compute_type="float32",
        )

    async def download_audio(self, url: str, user_id: str) -> str:
        filename = f"audio_{user_id}_{int(asyncio.get_event_loop().time())}.ogg"
        filepath = os.path.join(self.temp_dir, filename)

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to download audio: {response.status}",
                    )
                await self._write_chunks(response, filepath)

        return filepath

    @staticmethod
    async def _write_chunks(response, filepath: str):
        with open(filepath, "wb") as f:
            while chunk := await response.content.read(8192):
                f.write(chunk)

    async def transcribe(self, filepath: str):
        segments, info = self.model.transcribe(filepath)
        transcription = "\n".join(segment.text for segment in segments)
        return {
            "transcription": transcription,
            "language": info.language,
            "language_probability": info.language_probability,
        }

    @staticmethod
    def cleanup(filepath: str):
        try:
            os.unlink(filepath)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to cleanup file: {str(e)}",
            )


service = WhisperTranscriptionService(
    os.path.join(os.path.dirname(__file__), "../config.json")
)
app = FastAPI()


@app.post("/transcribe")
async def transcribe_audio(url: str, user_id: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL must be provided")

    try:
        filepath = await service.download_audio(url, user_id)
        result = await service.transcribe(filepath)
        service.cleanup(filepath)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=service.config["whisper"]["port"])
