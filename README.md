
# Amplify: AI-Powered Public Speaking Assistant

Amplify is an AI-driven application designed to help users enhance their public speaking skills in a judgment-free environment. The app provides personalized feedback, video analysis, and interactive learning experiences to combat public speaking anxiety and improve communication abilities.

Targeting students, professionals, and individuals across diverse demographics, Amplify offers an accessible, non-judgmental, and user-friendly platform for public speaking improvement.




## Features

- Speech-to-Text Analysis: Powered by Whisper-large-v3 for precise speech transcription.

- AI Feedback Mechanisms: Using Groq-llama3-70billion for personalized interaction.

- Video Analysis: Enabled by Gemini-experimental-1206 for multimodal evaluation.

- Dynamic Video Feedback: Feedback videos generated using HeyGen.

- Text-to-Speech Conversion: Seamlessly integrated through Deepgram.

- Cross-Platform Compatibility: Built using React Native and Expo.
## Tech Stack

### Frontend:
- React Native with Expo

### Backend: 
- Python 
- FastAPI 
- Deepgram
- Groq
- Supabase

[![workflow-2.png](https://i.postimg.cc/t4WXm328/workflow-2.png)](https://postimg.cc/DSfkSXVc)

- AI Models: Groq-llama3-70billion, Gemini-experimental-1206, Whisper-large-v3

- Video Tools: HeyGen

- Text-to-Speech: Deepgram

- Cloud Services: Cloudinary



[![workflow-3.png](https://i.postimg.cc/CMGsYXdK/workflow-3.png)](https://postimg.cc/5jtCSPBc)
## Setup Instructions

1. Clone the Repository

```bash
  git clone  https://github.com/TharunCodes07/Amplify
  cd amplify
```

2. Install Dependencies

```bash
  npm install
  pip install -r requirements.txt

```
3. Create a supabase project and run the following command
```bash
-- Create the tasks table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,              -- Auto-incrementing primary key for tasks
    user_id INT REFERENCES users(user_id),   -- Foreign key referencing the users table
    task TEXT NOT NULL,                      -- Task description
    completed BOOLEAN DEFAULT FALSE,         -- Task completion status (default: false)
    score JSON DEFAULT NULL,                 -- Score stored as JSON (default: null)
    host_url TEXT DEFAULT NULL               -- Stores the video hosted URL
);

-- Create the users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,              -- Auto-incrementing primary key
    username VARCHAR(255) NOT NULL,          -- Username field
    email VARCHAR(255) UNIQUE NOT NULL,      -- Email field (unique)
    password VARCHAR(255) NOT NULL,          -- Password field
    average_scores JSON NOT NULL,            -- Stores the average of all the scores that the user has so far
    tasks_completed INT DEFAULT 0           -- Stores the total number of completed tasks (default: 0)
);

```

4. Environment Variables: Create a .env file and add the necessary API keys:

```bash
  DB_USER=
  DB_PASSWORD=
  DB_HOST=
  DB_PORT=
  DB_NAME=
  GROQ_API_KEY=
  CEREBRAS_API_KEY=
  HYGEN_API_KEY=""
  TAVILY_API_KEY=
  GOOGLE_API_KEY=
  CLOUDINARY_KEY=
  DEEPGRAM_API_KEY= 
  SUPABASE_KEY=
  SUPABASE_URL=
```

5. To finally start the project run
```bash
  npx expo start
  cd server
  python server.py
```

## User Workflow
Amplify offers a meticulously designed and structured user experience, refined and optimized to ensure seamless and intuitive user interaction.

[![user-workflow.png](https://i.postimg.cc/htVbpYxx/user-workflow.png)](https://postimg.cc/dhty045t)


## Output


[![Picsart-24-12-30-00-36-08-803.png](https://i.postimg.cc/9FnfRXnF/Picsart-24-12-30-00-36-08-803.png)](https://postimg.cc/rK5T7TTv)
## Team

- #### Tharunkumar S (https://github.com/TharunCodes07)
- #### K S Venkatram (https://github.com/venkatramks)
- #### Sarveshwar V (https://github.com/sarveshwar-1)
