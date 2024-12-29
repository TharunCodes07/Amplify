from langchain_groq import ChatGroq
import os
from langchain import PromptTemplate
import psycopg2
from psycopg2 import sql
from langchain.tools import tool
from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda
from langgraph.prebuilt import ToolNode
from langchain_community.tools.tavily_search import TavilySearchResults
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import AnyMessage, add_messages
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time
import re

load_dotenv()
llm = ChatGroq(groq_api_key = os.getenv("GROQ_API_KEY"),model_name = "llama-3.1-70b-versatile")
GOOGLE_API_KEY=os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)


@tool("generate_scenario")
def generate_scenario(user_id,interest):
    """
    Generates a thought-provoking but relatable scenario where the user is speaking at a public event
    and stores it in the user's tasks table as an uncompleted task. The task is associated with the user_id, an integer.

    Args:
        user_id (int): The user_id of the user for whom the scenario is generated and stored.
        interest (str): The field in which the user expects the genrated scenario to be 
    
    Returns:
        str: A detailed scenario for public speaking based on the user's preferences.
    """
    db_config = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
    }

    template = '''
    You are tasked with generating engaging, innovative, and easy-to-understand public speaking scenarios. Each scenario should provide the user with a unique opportunity to practice their speaking skills. Ensure the scenario is fresh and has not been generated for this user before, leveraging memory to avoid repetitions. Additionally, incorporate the user's specified field or genre of interest when provided. If no interest is specified (NULL), proceed with generating a general scenario as usual.
    ## User Interest : {interest}

    ### Guidelines for Scenario Generation:
    1. **Engagement and Clarity**:
    - The scenario must be intriguing and relatable to encourage user participation.
    - Keep the description crisp and clear, focusing only on essential details while maintaining creativity and interest.

    2. **Skill Development**:
    - Design scenarios that challenge the user in a constructive way, helping them improve aspects of public speaking such as confidence, clarity, storytelling, persuasion, or audience engagement.
    - The scenario should align with real-life speaking opportunities, such as professional, social, or creative settings.

    3. **Incorporating User Interests**:
    - If the user specifies a field or genre of interest (e.g., motivational speaking, professional presentations, storytelling):
        - Tailor the scenario to align with the specified interest.
        - Ensure the scenario remains engaging and relevant to the user’s goals.
    - If the user specifies "nothing specific" or the interest is NULL:
        - Explicitly proceed with generating a general scenario while adhering to the outlined guidelines.

    4. **Scenario Structure**:
    - **Title**: Provide a descriptive and creative title that captures the essence of the scenario.
    - **Setup**: Briefly describe the context or situation where the user will speak.
    - **Task**: Clearly outline the objective of the speech or presentation, emphasizing the speaking skills they will practice.

    5. **Examples of Scenarios**:
    - **Title**: "Inspiring Entrepreneurs: A Community Celebration"
        **Setup**: You have been invited to host a community event celebrating local entrepreneurs. The audience includes aspiring business owners, established entrepreneurs, and community members.
        **Task**: Your task is to deliver an opening speech that sets an inspiring and positive tone for the evening, highlighting the importance of entrepreneurship and community support.

    - **Title**: "Career Insights: Inspiring the Next Generation"
        **Setup**: Imagine you are addressing a group of high school students at their career day. They are eager to learn about various professions and future opportunities.
        **Task**: Share insights about your profession, narrate an impactful personal experience, and inspire them to explore their passions confidently.

    - **Title**: "The Big Pitch: Securing Startup Funding"
        **Setup**: You are presenting your innovative startup idea to a group of investors at a professional conference. The stakes are high, and the room is filled with potential backers.
        **Task**: Clearly explain your concept, outline its unique value, and persuade the investors to provide funding, while handling potential questions with confidence.

    - **Title**: "A Toast to Love: Wedding Speech"
        **Setup**: You are the best man/maid of honor at a close friend’s wedding. The reception hall is packed with friends, family, and well-wishers.
        **Task**: Deliver a heartfelt and entertaining toast that celebrates the couple, shares a personal anecdote, and leaves a lasting impression on the guests.

    - **Title**: "The Climate Debate: A Public Forum"
        **Setup**: You are moderating a panel discussion on climate change at a community forum. The panel includes scientists, activists, and local policymakers.
        **Task**: Introduce the topic, engage the panelists with insightful questions, manage audience interactions, and summarize key takeaways at the end.

    6. **Memory Usage**:
    - Check previous scenarios generated for the user to avoid repetition.
    - Ensure the generated scenario adds value and novelty to the user's learning experience.
    - Do not generate scenarios that match the user's past responses.

    7. **Tone and Accessibility**:
    - Maintain a supportive and friendly tone in the scenario description.
    - Use language that is simple and easy to understand for users of all proficiency levels.

    8. **Response Structure**:
    - The response should be in markdown format with ### for the headings. 

    ### Notes:
    - Previous Responses: {chat_history}
    - Strongly prioritize incorporating the user's interest if provided. If the interest is NULL, proceed with a general scenario while maintaining creativity and relevance.
    - Avoid generating scenarios that have already been given to the user.
'''

    prompt = PromptTemplate.from_template(template)
    connection = None
    cursor = None
    try:
        memory = ConversationBufferMemory(memory_key="chat_history")
        model = LLMChain(
        llm=llm,
        prompt=prompt,
        verbose=True,
        memory=memory
        )


        response = model({"interest":interest})
        scenario = response.get('text')
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        # Insert the scenario into the user's tasks table
        insert_query = sql.SQL(
            "INSERT INTO tasks (user_id, task, completed, score) VALUES (%s, %s, %s, %s)"
        )
        cursor.execute(insert_query, (user_id, scenario, False, None))
        connection.commit()
        return f"Scenario successfully generated {response['text']}"

    except psycopg2.Error as e:
        print("Databse error", {e})
        return f"Database error: {e}"
    except Exception as e:
        return f"Error generating scenario: {e}"
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


    

def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }

def create_tool_node_with_fallback(tools: list) -> dict:
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
template = '''
You are an AI model designed to act as a friendly and engaging assistant for a public speaking improvement app. Your primary role is to interact with users in a conversational and supportive way, while also helping them complete tasks to improve their public speaking skills. You have access to two tools: `generate_scenario` and `TavilySearchResults`. Use these tools when necessary to provide meaningful and helpful responses.
### Key Behavior and Response Guidelines:

1. **General Conversation**:
   - Always reply in a friendly, engaging tone, similar to how a supportive friend would respond.
   - Address the user by their username to maintain a personal and approachable interaction style.
   - Avoid overly technical or robotic responses—keep the conversation warm and human-like.
   - Never respond to vulgar, offensive, or inappropriate language. Politely indicate that such language is unacceptable, but maintain professionalism.
   - Unless required do not use the tools. If the user just wants to speak just reply with a normal conversation do not use any tool.
   
2. **Tasks Handling**:
   - If the user's talks about tasks:
       - Ask the user if there is a specific field or genre they would like the scenario to focus on.
       - If the user specifies an interest, pass it as the `interest` argument to the `generate_scenario(user_id, interest)` tool.
       - If the user says "there’s nothing specific," pass `NULL` as the `interest` argument and proceed with scenario generation.
       - Provide a very brief and clear description of the generated scenario, focusing only on the most important detail like in the example : (e.g., "You’ve been tasked with delivering an inspiring speech at a school graduation ceremony on the topic "The future of AI"). The response should not exceed 160 characters

3. **Tool Usage**:
   - **`generate_scenario`**:
     - Use this tool when the user requests a new scenario for practicing public speaking or when the incomplete tasks field is NULL and the user agrees to create a new task.
     - Before invoking the tool, ask the user about any specific interest or field they would like the scenario to target.
   - **`TavilySearchResults(max_results=3)`**:
     - Use this tool if the user asks for detailed or up-to-date information that cannot be answered directly, such as information about public speaking techniques, famous speeches, or current events.
   - Avoid using tools unnecessarily. Only invoke a tool if it is clear that the user's query requires it or if it improves the interaction.

4. **Guidance and Growth**:
   - For every user interaction related to public speaking, aim to motivate and guide them. Provide actionable tips or advice where relevant.
   - If a user asks for feedback or tips about public speaking, respond directly with insights, avoiding the use of tools unless specific research is needed.

5. **Handling User Queries**:
   - If the query is straightforward and doesn’t require tool invocation (e.g., "What’s the best way to calm nerves before speaking?"), respond directly with practical advice.
   - If the query is vague or unclear, ask clarifying questions to better understand the user's needs.
   - If the query is unrelated to public speaking but within general conversation scope, respond naturally to maintain engagement.

6. **Memory and Personalization**:
   - Utilize memory to recall ongoing tasks, preferences, and interactions with the user.
   - Ensure that any new scenarios or tasks are appropriately stored and associated with the user ID.

7. **Restrictions**:
   - Do not generate or support inappropriate, vulgar, or harmful content.
   - Avoid using the tools for queries that can be answered directly without them.

### Example Interactions:

**Scenario 1: User with NULL Incomplete Tasks**
User Query: "I don't see any tasks. Can you help me create one?"
Response: "Sure, would you like me to generate a new public speaking scenario for you? Let me know!"

- If the user says "yes":
  - Respond: "Is there a specific field or genre you’d like the scenario to focus on? For example, motivational speaking, professional presentations, or storytelling?"
    - If the user specifies an interest, use `generate_scenario(user_id, interest)` and pass the interest provided by the user.
    - If the user says "there’s nothing specific," use `generate_scenario(user_id, NULL)`.
  - Respond with a brief description of the scenario: "Here’s your new task: You’ll be presenting an award speech at a local charity event. Let me know when you’re ready to start!"
- If the user says "no":
  - Respond: "Alright, feel free to ask me anything else or let me know if you'd like to create a task later!"

**Scenario 2: User Asks for Public Speaking Tips**
User Query: "What’s the best way to start a speech?"
Response: "Starting strong is key! You can begin with a powerful quote, a compelling story, or even a surprising fact that grabs attention. What kind of speech are you preparing for?"

**Scenario 3: Inappropriate Language**
User Query: "This app is stupid!"
Response: "I’m here to help you improve your speaking skills and provide a positive experience. Let’s keep the conversation respectful and focused on growth."

**Scenario 4: Web Search Requirement**
User Query: "Can you find some examples of TED talks on overcoming fear?"
Response: (Invoke `TavilySearchResults(max_results=3)` with a query for TED talks on overcoming fear, then summarize results briefly.)

### Important Notes:
- Be proactive in assisting users and encouraging their growth.
- Keep responses concise yet engaging and informative.
- Use tools strategically to enhance the user experience without over-relying on them.
'''

from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig


class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state: State, config: RunnableConfig):
        while True:
            configuration = config.get("configurable", {})
            user_id = configuration.get("user_id", None)
            state = {**state, "user_info": user_id}
            result = self.runnable.invoke(state)
            if not result.tool_calls and (
                not result.content
                or isinstance(result.content, list)
                and not result.content[0].get("text")
            ):
                messages = state["messages"] + [("user", "Respond with a real output.")]
                state = {**state, "messages": messages}
            else:
                break
        return {"messages": result}



prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            template,
        ),
        ("placeholder", "{messages}"),
    ]
)

tools = [
    generate_scenario,
    TavilySearchResults(max_results=3)
]


runnable = prompt | llm.bind_tools(tools)
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import tools_condition


builder = StateGraph(State)


# Define nodes: these do the work
builder.add_node("assistant", Assistant(runnable))
builder.add_node("tools", create_tool_node_with_fallback(tools))
# Define edges: these determine how the control flow moves
builder.add_edge(START, "assistant")
builder.add_conditional_edges(
    "assistant",
    tools_condition,
)
builder.add_edge("tools", "assistant")

# The checkpointer lets the graph persist its state
# this is a complete memory for the entire graph.
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)



# config = {
#     "configurable": {
#         # The passenger_id is used in our flight tools to
#         # fetch the user's flight information
#         "user_id": "UserName : Tharun , user_id : 123, Incomplete Tasks : NULL",
#         # Checkpoints are accessed by thread_id
#         "thread_id": 123,
#     }
# }

# out = graph.invoke(
#     {"messages": ("user", "Hi")},
#       config
# )
# out.get("messages")[-1].content

def askAgent(query:str,config:dict) -> str:
    out = graph.invoke(
        {"messages": ("user", query)}, config
    )
    return out.get("messages")[-1].content

def extract_json(input_string):
    try:
        # Extract the JSON part using a regular expression
        match = re.search(r'```json([\s\S]*?)```', input_string)
        if match:
            json_string = match.group(1).strip()  # Extract and strip any extra whitespace
            return json.loads(json_string)  # Parse the JSON string into a Python dictionary
        else:
            print("No JSON found in the string.")
            return None
    except json.JSONDecodeError:
        print("Invalid JSON format.")
        return None

def score(video_url,task,task_id):
    print("Scoring")
    db_config = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
    }
    model = genai.GenerativeModel(model_name="gemini-exp-1206")
    prompt = f'''
    You are an advanced scoring AI tool designed to evaluate user-submitted videos of public speaking tasks. Your role is to analyze the video and its corresponding task, providing constructive feedback and scores to help users improve their public speaking skills. Your response must include only the evaluation output in the specified JSON format and exclude any code block syntax or additional text.
    Make sure to take in the relevancy of the speech with respect to the topic
    ### Evaluation Guidelines:

    1. **Feedback Description**:
      - Provide a detailed, 2000-character feedback description in paragraph format.
      - This feedback should:
        - Explain areas where the user performed well and areas needing improvement.
        - Offer actionable advice on how the user can enhance their public speaking skills in alignment with the task.
        - Focus on key aspects of public speaking, such as structure, clarity, delivery, engagement, and alignment with the task.
        - Maintain a constructive, encouraging, and friendly tone.

    2. **Scoring Criteria**:
      - Evaluate the user's performance across three key areas, each scored on a scale from 0 to 100:
        - **CONTENT**:
          - Assess how well the speech content aligns with the given task.
          - Consider factors such as relevance, structure, depth, and creativity of the content.
        - **FLUENCY**:
          - Evaluate the user's speech fluency, including smoothness, pace, and lack of interruptions or filler words.
        - **EXPRESSION**:
          - Analyze the user's body language, gestures, facial expressions, and emotional engagement with the audience.

    3. **Output Format**:
      - Provide the evaluation strictly in this format:
        ```json
        {{
          "feedback_description": "Example feedback.",
          "scores": {{
            "content": 90,
            "fluency": 85,
            "expression": 80
          }}
        }}
        ```

    ### IMPORTANT:
    - Output only the JSON content as specified in the **Output Format** section.
    - Do not include any explanations, comments, or additional text outside the structured JSON output.

    CURRENT TASK: {task}
    '''


    connection = None
    cursor = None
    try:
      video_file = genai.upload_file(path=video_url)
      print(f"Completed upload: {video_file.uri}")
      while video_file.state.name == "PROCESSING":
        time.sleep(10)
        video_file = genai.get_file(video_file.name)

      if video_file.state.name == "FAILED":
        raise ValueError(video_file.state.name)
      response = model.generate_content([video_file,prompt],
                                    request_options={"timeout": 600})
      print(response.text)
      parsed_output = extract_json(response.text)
      connection = psycopg2.connect(**db_config)
      cursor = connection.cursor()

      update_query = sql.SQL("""
            UPDATE tasks
            SET score = %s, completed = TRUE
            WHERE task_id = %s
        """)
      cursor.execute(update_query, (json.dumps(parsed_output["scores"]), task_id))
      connection.commit()
      print(parsed_output["feedback_description"])
      return parsed_output["feedback_description"]
    except psycopg2.Error as e:
       print(f'Databse Error: {e}')
    except Exception as e:
        print(f"Error scoring: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()