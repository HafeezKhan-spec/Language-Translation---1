from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from deep_translator import GoogleTranslator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="English to Telugu Translation API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Translation function using deep-translator
def translate_to_telugu(text: str) -> str:
    try:
        logger.info(f"Translating text: {text}")
        translator = GoogleTranslator(source='en', target='te')
        translation = translator.translate(text)
        return translation
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise

# Translation endpoint
@app.post("/translate")
async def translate(request: Request):
    try:
        body = await request.json()
        text = body.get("text")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        translated_text = translate_to_telugu(text)
        return {"translatedText": translated_text}
    except Exception as e:
        logger.error(f"Endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Run the server
if __name__ == "__main__":
    logger.info("Starting server...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
