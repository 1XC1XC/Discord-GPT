from fastapi import FastAPI, HTTPException
from faster_whisper import WhisperModel
from typing import Optional
import aiohttp
import asyncio
import uvicorn
import os
import logging
from pydantic import BaseModel


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("whisper_api")
logger.disabled = True


class TranscriptionRequest(BaseModel):
    url: str


class RequestBody(BaseModel):
    transcription_request: TranscriptionRequest


app = FastAPI()
model_size = "large"
model = WhisperModel(
    model_size,
    device="cuda",
    compute_type="float32",
)


async def download_audio(url: str, user_id: str) -> str:
    """Download audio from URL and save with user-specific filename"""
    logger.debug(f"Downloading audio from URL: {url} for user: {user_id}")

    filename = f"audio_{user_id}_{int(asyncio.get_event_loop().time())}.ogg"
    filepath = os.path.join("temp_audio", filename)

    os.makedirs("temp_audio", exist_ok=True)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to download audio: {response.status}",
                    )

                with open(filepath, "wb") as f:
                    while True:
                        chunk = await response.content.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)

                logger.debug(f"Successfully downloaded to {filepath}")
                return filepath
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Download failed: {str(e)}",
        )


@app.post("/transcribe")
async def transcribe_audio(body: RequestBody, user_id: Optional[str] = None):
    """Transcribe audio from URL."""
    logger.info(f"Transcription request received - User ID: {user_id}")
    logger.debug(f"Request body: {body.dict()}")

    filepath = None
    try:
        if not body.transcription_request.url:
            raise HTTPException(status_code=400, detail="URL must be provided")

        filepath = await download_audio(
            body.transcription_request.url, user_id or "default"
        )

        logger.info("Starting transcription")
        segments, info = model.transcribe(filepath)
        transcription = "\n".join(segment.text for segment in segments)
        logger.info("Transcription complete")

        return {
            "transcription": transcription,
            "language": info.language,
            "language_probability": info.language_probability,
        }

    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}",
        )

    finally:
        if filepath and os.path.exists(filepath):
            try:
                os.unlink(filepath)
                logger.debug(f"Cleaned up file: {filepath}")
            except Exception as e:
                logger.error(f"Error cleaning up file {filepath}: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
