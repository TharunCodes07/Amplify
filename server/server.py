from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from agent import askAgent, score
import psycopg2
import os
import requests
import time
import sys
import aiofiles
from dotenv import load_dotenv
import cloudinary
import json
import cloudinary.uploader
import logging

# Set up logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  
CHUNK_SIZE = 1024 * 1024  
UPLOAD_DIR = "./server/uploaded_videos"
load_dotenv()
os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_db_config():
    required_vars = ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please create a .env file with the required variables.")
        sys.exit(1)

def create_db_connection(max_retries=3, retry_delay=5):
    validate_db_config()
    db_config = {
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "dbname": os.getenv("DB_NAME"),
    }
    print(f"Connecting to database with config: {db_config}")
    for attempt in range(max_retries):
        try:
            return psycopg2.connect(**db_config)
        except psycopg2.OperationalError as e:
            if attempt == max_retries - 1:
                print(f"Failed to connect to database after {max_retries} attempts: {e}")
                sys.exit(1)
            print(f"Database connection attempt {attempt + 1} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)

@app.on_event("startup")
async def startup_event():
    global connection
    global cursor
    connection = create_db_connection()
    cursor = connection.cursor()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

class QueryRequest(BaseModel):
    query: str
    email: str

class ReviewRequest(BaseModel):
    task: str
    task_id: str
    user_email : str


@app.post("/upload_video/")
async def upload_video(task_id: str = Form(...), file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only video files are allowed.")
        
        # Generate file path using task_id
        file_name = f"{task_id}.mp4"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        file_size = 0
        # Stream file in chunks to avoid memory issues
        async with aiofiles.open(file_path, 'wb') as f:
            while chunk := await file.read(CHUNK_SIZE):
                file_size += len(chunk)
                if file_size > MAX_UPLOAD_SIZE:
                    # Clean up partial file
                    await f.close()
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE/1024/1024}MB"
                    )
                await f.write(chunk)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "File uploaded successfully",
                "file_path": file_path,
                "file_size": file_size
            }
        )
        
    except Exception as e:
        # Clean up any partial uploads in case of errors
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")



@app.get("/video/{filename}")
async def get_video(filename: str):
    video_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")

    def iterfile():
        with open(video_path, "rb") as f:
            while chunk := f.read(1024 * 1024):
                yield chunk

    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Disposition": f"inline; filename={filename}"
        }
    )


@app.post("/resp")
async def resp(request:QueryRequest):
    email = request.email
    # out = AgentCall(query, chat_history)
    find_query = """
    SELECT * 
    FROM users
    WHERE email = %s;
    """
    cursor.execute(find_query, (email,))
    user_details = cursor.fetchone()
    query = request.query + "USER_ID : " + str(user_details[0])
    config = {
        "configurable" : {
            "user_id" : user_details,
            "thread_id" : user_details[0]
        }
    }
    print(user_details)
    resp =  askAgent(query, config)
    # graph.invoke(
    #     {
    #         "messages": ("user", query)
    #     }, config
    # )
    print(resp)
    return {"response": resp}


class ReviewRequest(BaseModel):
    task: str
    task_id: str
    user_email: str

@app.post("/review")
async def review(request: ReviewRequest):
    cloudinary.config(
            cloud_name="dcy3adtja",
            api_key="979827254371564",
            api_secret=os.getenv("CLOUDINARY_KEY"),
            secure=True
        )
    # Step 1: Generate feedback text
    video_path = f"./server/uploaded_videos/{request.task_id}.mp4"
    feedback_text = score(video_path, request.task, request.task_id)
    print("FEEDBACK_TEXT", feedback_text)
    if not feedback_text:
        raise HTTPException(status_code=500, detail="Scoring process failed or returned no output")

    # Step 2: HeyGen API Configuration
    api_url = 'https://api.heygen.com/v2/video/generate'
    api_key = os.getenv('HYGEN_API_KEY')

    if not api_key:
        raise HTTPException(status_code=500, detail="HYGEN_API_KEY not configured")

    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": "14a49b9113914452bc76f94c1a23e278",
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": feedback_text,
                    "voice_id": "45980606751346deaf6415a2ba6cdfde",
                },
                "background": {
                    "type": "color",
                    "value": "#000000",
                },
            },
        ],
        "dimension": {
            "width": 1280,
            "height": 720,
        },
    }
    try:
        response = requests.post(
            api_url,
            headers={
                'X-Api-Key': api_key,
                'Content-Type': 'application/json',
            },
            json=payload,
        )
        data = response.json()
        print('Video generation response:', data)
        video_id = data.get("data", {}).get("video_id")
        print(video_id)

        video_status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        while True:
            status_resp = requests.get(video_status_url, headers={'X-Api-Key': api_key})
            status_resp.raise_for_status()
            status = status_resp.json()["data"]["status"]
            if status == "completed":
                video_url = status_resp.json()["data"]["video_url"]
                local_path = f"./server/response_videos/{request.task_id}.mp4"
                video_content = requests.get(video_url).content
                with open(local_path, "wb") as video_file:
                    video_file.write(video_content)

                cloudinary_response = cloudinary.uploader.upload(
                    local_path,
                    resource_type="video",
                    folder="review_videos"
                )
                host_url = cloudinary_response["secure_url"]
                print(host_url)

                # Step 5: Update database with hosted URL and increment tasks_completed


                update_url_query = """
                UPDATE tasks
                SET host_url = %s
                WHERE task_id = %s;
                """
                
                cursor.execute(update_url_query, (host_url,request.task_id))
                print("Updated url")
                connection.commit()


                print(host_url)
                update_task_query = """
                UPDATE tasks
                SET completed = TRUE
                WHERE task_id = %s;
                """
                cursor.execute(update_task_query, (request.task_id))
                connection.commit()
                print("updated task")

                # Fetch user details using email
                user_query = "SELECT avg_scores, tasks_completed FROM users WHERE email = %s;"
                cursor.execute(user_query, (request.user_email,))
                user_data = cursor.fetchone()
                print("Fetched user",user_data)

                if not user_data:
                    raise HTTPException(status_code=404, detail="User not found")

                avg_scores, tasks_completed = user_data
                new_tasks_completed = tasks_completed + 1

                # Calculate new average scores
                current_scores = request.scores  # Example: {"content": 85, "fluency": 70, "expression": 90}
                for category, new_score in current_scores.items():
                    scaled_score = new_score / 100  # Scale score to [0, 1]

                    # Adjust average based on new score
                    if scaled_score > 0.75:
                        avg_scores[category] += 0.025
                    else:
                        avg_scores[category] -= 0.015

                    # Clamp scores between 0 and 1
                    avg_scores[category] = max(0, min(1, avg_scores[category]))

                update_user_query = """
                UPDATE users
                SET tasks_completed = %s, avg_scores = %s
                WHERE email = %s;
                """
                cursor.execute(update_user_query, (new_tasks_completed, json.dumps(avg_scores), request.user_email))
                connection.commit()

                return {"status": "success", "video_url": host_url}

            elif status in ["processing", "pending"]:
                time.sleep(5)
            elif status == "failed":
                error_detail = status_resp.json()["data"].get("error", "Unknown error")
                raise HTTPException(status_code=500, detail=f"Video generation failed: {error_detail}")
            
    except psycopg2.Error as db_error:
        logging.error("Database error occurred:", exc_info=db_error)
        raise HTTPException(status_code=500, detail="A database error occurred")
    except Exception as e:
        logging.error("An unexpected error occurred:", exc_info=e)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
