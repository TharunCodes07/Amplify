from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
# from llm import AgentCall
from agent import graph,askAgent
import psycopg2
from psycopg2 import sql
import os
app = FastAPI()
import requests
import time

@app.on_event("startup")
async def startup_event():
    db_config = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
}
    global connection
    connection = psycopg2.connect(**db_config)
    global cursor 
    cursor = connection.cursor()
    
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of domains that can communicate with the API
    allow_credentials=True,
    allow_methods=["*"],  # HTTP methods to allow, e.g., GET, POST, etc.
    allow_headers=["*"],  # HTTP headers to allow
)

class QueryRequest(BaseModel):
    query: str
    email: str

class ReviewRequest(BaseModel):
    text : str
    video: str

@app.post("/resp")
async def resp(request:QueryRequest):
    query = request.query
    email = request.email
    # out = AgentCall(query, chat_history)
    find_query = """
    SELECT * 
    FROM users
    WHERE email = %s;
    """
    cursor.execute(find_query, (email,))
    user_details = cursor.fetchone()
    config = {
        "configurable" : {
            "user_id" : user_details,
            "thread_id" : user_details[0]
        }
    }
    resp =  askAgent(query, config)
    # graph.invoke(
    #     {
    #         "messages": ("user", query)
    #     }, config
    # )
    print(resp)
    return {"response": resp}


@app.post("/review")
async def review(request:ReviewRequest):
    review = request.text
    review = '''"Create a detailed video analysis on 'How to stay calm when you know you'll be stressed,' focusing on body language, speech fluency, and content delivery to provide actionable feedback for improvement. Body Language: At [00:00:13], note Levitin's initial posture and stage presence. Highlight his tendency to keep his hands clasped or in his pockets, especially noticeable at [00:00:34] and [00:00:57], suggesting nervousness or a lack of engagement. Recommend adopting a more open posture with purposeful hand gestures to enhance audience connection. At [00:00:40], demonstrate how limited upper body movement contributes to a sense of stiffness. Use slow-motion playback at [00:01:12] and [00:01:48] to emphasize his restrained gestures, which could be more expressive to match his storytelling. Suggest incorporating varied hand movements to illustrate points more effectively. Speech Fluency: Analyze Levitin's speech pacing, pointing out instances of rapid delivery, like at [00:00:24], that may hinder audience comprehension. Identify the use of filler words such as 'uh' and 'um,' notably at [00:00:16] and [00:01:53], which can detract from his authority. Content Delivery: At [00:00:13], when Levitin begins his personal anecdote, use on-screen text to highlight narrative structuring techniques that could make his story more compelling. Suggest a clearer setup, conflict, and resolution framework to enhance engagement. ], when transitioning to the advice section, suggest stronger transitional phrases for better flow. Analyze the talk's conclusion at [00:11:36], recommending a more impactful closing statement that summarizes key takeaways and includes a call to action. Recommendations: Conclude with a recap of actionable recommendations: Improve Posture and Gestures: Stand tall with an open posture, using varied and purposeful hand gestures to engage the audience and emphasize key points. Practice in front of a mirror or with a coach to ensure movements are natural and not distracting. Enhance Speech Fluency: Use pauses to emphasize important points and to allow the audience time to process information.  Refine Content Delivery: Structure your narrative more effectively with a clear introduction, conflict, and resolution. Seek feedback from peers or a speaking coach to identify areas for improvement and refine your delivery.  The video should be visually engaging, using on-screen text, graphics, and slow-motion playback to highlight key moments and techniques. Maintain a supportive and motivational tone, aimed at empowering Levitin to refine his presentation skills for greater audience engagement and impact. The final product should be an insightful and highly educational video, serving as a valuable resource for Levitin's growth and development in public speaking."'''
    print(len(review))
    video = request.video
    api_url = 'https://api.heygen.com/v2/video/generate'
    api_key = os.getenv('HYGEN_API_KEY')

    # Payload for the request
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": "0890f82bd3e94962af657180a92c3745",
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": review,  
                    "voice_id": "2d5b0e6cf36f460aa7fc47e3eee4ba54",
                },
                "background": {
                    "type": "color",
                    "value": "#008000",
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

        response.raise_for_status()
        data = response.json()
        print('Video generation response:', data)
        video_id = data.get("data", {}).get("video_id")
        print(video_id)
        video_status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        while True:
            response = requests.get(
                video_status_url,
                headers={
                'X-Api-Key': api_key,
            }
                )
            status = response.json()["data"]["status"]
            print(status)

            if status == "completed":
                video_url = response.json()["data"]["video_url"]
                thumbnail_url = response.json()["data"]["thumbnail_url"]
                print(
                    f"Video generation completed! \nVideo URL: {video_url} \nThumbnail URL: {thumbnail_url}"
                )
                video_filename = "generated_video.mp4"
                with open(video_filename, "wb") as video_file:
                    video_content = requests.get(video_url).content
                    video_file.write(video_content)
                break
                
            elif status == "processing" or status == "pending":
                print("Video is still processing. Checking status...")
                time.sleep(5)  # Sleep for 5 seconds before checking again
                
            elif status == "failed":
                error = response.json()["data"]["error"]
                print(f"Video generation failed. '{error}'")
                break
    except requests.exceptions.RequestException as e:
        print(f"Error generating video: {e}")
    
    
    return {"response": "reviewed"}
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
