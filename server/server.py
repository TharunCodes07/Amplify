from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
# from llm import AgentCall
from agent import graph,askAgent
import psycopg2
from psycopg2 import sql
import os
app = FastAPI()

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
