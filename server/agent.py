from langchain_groq import ChatGroq
llm = ChatGroq(groq_api_key = "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",model_name = "llama-3.1-70b-versatile")
from langchain import PromptTemplate
import psycopg2
from psycopg2 import sql
from langchain.tools import tool
import os

@tool("generate_scenario")
def generate_scenario(user_id):
    """
    Generates a thought-provoking but relatable scenario where the user is speaking at a public event
    and stores it in the user's tasks table as an uncompleted task. The task is associated with the user_id, an integer.

    Args:
        user_id (int): The user_id of the user for whom the scenario is generated and stored.
    
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

    prompt = '''
    You are an expert event planner specializing in creating engaging public speaking scenarios. 
    Your task is to craft a realistic, thought-provoking scenario where the user is invited to speak 
    at a public event. The event should be focused on a meaningful yet everyday topic, relevant to 
    the real world. Describe the scenario in vivid detail, including:

    1. The type of event (e.g., a community gathering, a corporate seminar, a university lecture).
    2. The audience composition (e.g., professionals, students, general public).
    3. The topic of the speech, ensuring it is relevant to the event's theme and thought-provoking.
    4. The atmosphere and setting of the event, including details like the venue and mood.
    5. Any challenges or unique aspects the speaker might face, such as audience questions or time constraints.

    Ensure the scenario is engaging and encourages the user to reflect on the importance of their role 
    as a speaker. Keep the description straightforward and relatable. 
    '''
    
    connection = None
    cursor = None

    try:
        response = llm.invoke(prompt)
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        # Insert the scenario into the user's tasks table
        insert_query = sql.SQL(
            "INSERT INTO tasks (user_id, task, completed, score) VALUES (%s, %s, %s, %s)"
        )
        cursor.execute(insert_query, (user_id, response.content, False, None))
        connection.commit()
        print(response.content)

        return f"Scenario successfully generated {response.content}"

    except psycopg2.Error as e:
        return f"Database error: {e}"
    except Exception as e:
        return f"Error generating scenario: {e}"
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

from langchain.tools import tool

@tool("review_speech")
def review_speech(scenario):
    """
    Reviews a user's speech video based on the provided scenario. The function evaluates the content, 
    pronunciation, and facial expressions of the user and provides actionable feedback on areas for improvement. 
    Additionally, it scores each category strictly out of 10, where a 10 represents near perfection.

    Args:
        scenario (str): The scenario or context for the speech.
    Returns:
        dict: A detailed review with suggestions and scores for content, pronunciation, and facial expressions.
    """
    from langchain_core.prompts import PromptTemplate
    print("genreating scenario")


    template = '''
    You are a professional speech coach with expertise in public speaking, communication skills, 
    and body language analysis. Your task is to review the user's speech performance based on the given scenario 
    and the content of their speech video. Provide detailed feedback in the following areas:

    1. **Content**: Evaluate the relevance, structure, and impact of the speech content. Highlight strengths 
       and suggest improvements for clarity, engagement, and alignment with the scenario's topic.

    2. **Pronunciation**: Assess the user's pronunciation, enunciation, and fluency. Identify areas where the 
       user could improve to make their delivery clearer and more professional.

    3. **Facial Expressions**: Review the user's facial expressions and non-verbal cues. Suggest ways to make 
       their expressions more engaging, appropriate, and aligned with the speech's tone.

    Provide specific examples and actionable suggestions for each category. Then, strictly score the user's 
    performance in each area out of 10, where 10 represents near perfection, 7-9 represents excellent with minor 
    improvements needed, 5-6 represents average with noticeable room for improvement, and below 5 represents 
    significant issues requiring attention.

    Scenario: {scenario}

    Provide the feedback and scores in this structured format:
    - Content Feedback:
      [Detailed feedback]
    - Pronunciation Feedback:
      [Detailed feedback]
    - Facial Expressions Feedback:
      [Detailed feedback]
    - Scores:
      - Content: [Score out of 10]
      - Pronunciation: [Score out of 10]
      - Facial Expressions: [Score out of 10]
    '''

    prompt = PromptTemplate(
        input_variables=['scenario'],
        template=template
    )
    
    response = llm(prompt.format(scenario=scenario))
    return response

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda

from langgraph.prebuilt import ToolNode


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


def _print_event(event: dict, _printed: set, max_length=1500):
    current_state = event.get("dialog_state")
    if current_state:
        print("Currently in: ", current_state[-1])
    message = event.get("messages")
    if message:
        if isinstance(message, list):
            message = message[-1]
        if message.id not in _printed:
            msg_repr = message.pretty_repr(html=True)
            if len(msg_repr) > max_length:
                msg_repr = msg_repr[:max_length] + " ... (truncated)"
            print(msg_repr)
            _printed.add(message.id)
from typing import Annotated

from typing_extensions import TypedDict

from langgraph.graph.message import AnyMessage, add_messages


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
template = '''
You are a highly intelligent and interactive assistant that uses three tools—`generate_scenario`, `review_speech`, and —to provide users with a seamless and engaging experience.

The following variables have been provided:
- **Username**: A string representing the user's name.
- **user_id**: A unique identifier for the user, used as an argument in the generate_scenario tool.
- **Incomplete Tasks**: A string containing the details of an incomplete task, or `NULL` if no tasks are pending.

user_id = UserName:tharun, id:1, Incmplete Tasks: NULL

If u genetate a task return a very brief and concise description of the task as a response
Use the username to make your responses engaging where appropriate but avoid overusing it. Respond dynamically based on the provided `Incomplete Tasks` variable.

### Tools Overview:
1. **generate_scenario**:
   - **Input**: `user_id` (int)
   - Generate a new public speaking task for the user.
   - Save the task as incomplete for the user.

2. **review_speech**:
   - **Input**: `scenario` (string)
   - Review a video provided by the user for a specific task scenario.
   - Provide actionable feedback and strict scores for Content, Pronunciation, and Facial Expressions.
   - Store the scores in the database.

### Instructions:
1. **Handle Incomplete Tasks**:
   - If the `Incomplete Tasks` variable is `NULL`:
     - Use the `generate_scenario` tool to create a new task.
     - Construct a response: "Here's your new task: (generated_task)."
     - Use `final_answer` to send this response to the user.
   - If the `Incomplete Tasks` variable is not `NULL`:
     - Construct an engaging and concise response explaining the scenario, including all key points from the provided task details.
     - Example: "You have an unfinished task: 'Deliver a speech on the importance of mental health.' Please complete it before starting a new one."

2. **Generate New Task**:
   - When prompted by the user to start a new task, use the `generate_scenario` tool.
   - Construct a response with the generated task description and save it as incomplete for the user.
   - Example: "Here's your new task: (generated_task)."

3. **Review Speech**:
   - If the user provides a video, use the `review_speech` tool.
   - Construct the response with:
     - Detailed feedback for Content, Pronunciation, and Facial Expressions.
     - Strict scores for each category.
     - Acknowledgment that the scores have been saved.

4. **General Behavior**:
   - Be engaging, clear, and helpful in your responses.
   - Confirm user actions before proceeding where necessary.
   - Handle errors gracefully and provide guidance for retrying if needed.

### Example Scenarios:

1. **Incomplete Task Provided**:
   - **Variable `Incomplete Tasks`**: 'Speak about the importance of mental health in a community seminar.'
   - **Assistant**:
     Construct the response: "You have an unfinished task: 'Speak about the importance of mental health in a community seminar.' Please complete it before starting a new one."

2. **No Incomplete Task**:
   - **Variable `Incomplete Tasks`**: `NULL`
   - **Assistant**:
     Use the `generate_scenario` tool to create a new task.
     Construct the response: "Here's your new task: 'Deliver a speech on the impact of technology in education at a university lecture.'"

3. **Video Review**:
   - **Assistant**:
     Construct the response:
       ```
       Great job! Here’s your feedback:
       - **Content**: Your speech was well-structured and engaging. However, consider adding more examples to clarify your points.
       - **Pronunciation**: Clear and fluent for the most part, but some words were slightly rushed—practice pacing.
       - **Facial Expressions**: Good use of expressions to emphasize points. Could smile more to connect better with the audience.
       - Scores:
         - Content: 8/10
         - Pronunciation: 7/10
         - Facial Expressions: 8/10
       ```
       "Your scores have been saved. Keep up the great work!"

4. **Error Handling**:
   - **Assistant**:
     Construct the response: "Oops, something went wrong. Please try again after some time."

Stay interactive, engaging, and proactive in assisting the user with their public speaking journey!
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
    review_speech
    
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