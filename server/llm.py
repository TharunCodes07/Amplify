# %pip install langgraph langsmith langchain_groq langchain_community
# %pip install graphviz libgraphviz-dev pkg-config
from langchain_groq import ChatGroq
llm = ChatGroq(groq_api_key = "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",model_name = "llama-3.1-70b-versatile")
from typing import TypedDict, Annotated, List, Union
from typing_extensions import TypedDict
from langgraph.graph import StateGraph,START,END
from langchain_core.agents import AgentAction, AgentFinish
import operator
import os
from langchain_core.messages import BaseMessage
### Graph State



# from langchain_cerebras import ChatCerebras

# llm = ChatCerebras(
#     model="llama-3.3-70b",
#     api_key=os.environ.get("CEREBRAS_API_KEY"),
# )

class AgentState(TypedDict):
    input:str
    chat_history: list[BaseMessage]
    intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add]

from langchain_core.prompts import PromptTemplate
import psycopg2
from psycopg2 import sql
from langchain.tools import tool

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
        "database": "Talkie",
        "user": "postgres",
        "password": "1234",
        "host": "localhost",
        "port": "5432"
    }

    prompt = '''
    Genereate me a radom scenario for public speaking
    '''
    
    connection = None
    cursor = None

    try:
        response = llm.invoke(prompt)
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        # Insert the scenario into the user's tasks table
        insert_query = sql.SQL(
            "INSERT INTO tasks (user_id, task, completed, scoreS) VALUES (%s, %s, %s, %s)"
        )
        cursor.execute(insert_query, (user_id, response.content, False, None))
        connection.commit()

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
    from langchain import PromptTemplate

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


@tool("final_answer")
def final_answer(output: str):
    """
    To send the final response to the user, use this tool.
    
    This tool is used when the processing is complete, and the assistant needs to provide the ultimate result or conclusion to the user.
    It takes a single string input, `output`, which represents the final response, and returns it as the user's answer.

    Parameters:
    - output (str): The final response message to be sent to the user.

    Returns:
    - str: The final response, which will be displayed to the user.
    """
    return output

## Head
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

template = '''
You are a highly intelligent and interactive assistant that uses three tools—`generate_scenario`, `review_speech`, and `final_answer`—to provide users with a seamless and engaging experience.
The following variables have been provided:
- **Username**: A string representing the user's name.
- **user_id**: A unique identifier for the user, used as an argument in the generate_scenario tool.
- **Incomplete Tasks**: A string containing the details of an incomplete task, or `NULL` if no tasks are pending.

Username : {username}
user_id : {user_id}
Incomplete Tasks : {incomplete_tasks}

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

3. **final_answer**:
   - **Input**: `output` (string)
   - Always use this tool to send the final response to the user.
   - After constructing the response, pass it to `final_answer` to provide the output.

### Instructions:
1. **Handle Incomplete Tasks**:
   - If the `Incomplete Tasks` variable is `NULL`:
     - Use the `generate_scenario` tool to create a new task.
     - Construct a response: "Here's your new task: (generated_task)."
     - Use `final_answer` to send this response to the user.
   - If the `Incomplete Tasks` variable is not `NULL`:
     - Construct an engaging and concise response explaining the scenario, including all key points from the provided task details.
     - Example: "You have an unfinished task: 'Deliver a speech on the importance of mental health.' Please complete it before starting a new one."
     - Use `final_answer` to send this response to the user.

2. **Generate New Task**:
   - When prompted by the user to start a new task, use the `generate_scenario` tool.
   - Construct a response with the generated task description and save it as incomplete for the user.
   - Example: "Here's your new task: (generated_task)."
   - Use `final_answer` to send this response to the user.

3. **Review Speech**:
   - If the user provides a video, use the `review_speech` tool.
   - Construct the response with:
     - Detailed feedback for Content, Pronunciation, and Facial Expressions.
     - Strict scores for each category.
     - Acknowledgment that the scores have been saved.
   - Use `final_answer` to send this response to the user.

4. **General Behavior**:
   - Be engaging, clear, and helpful in your responses.
   - Confirm user actions before proceeding where necessary.
   - Handle errors gracefully and provide guidance for retrying if needed.
   - Always send the final output to the user using the `final_answer` tool.

### Rules for Tool Usage:
- No matter what, you must always use the `final_answer` tool to send the final response to the user. Do not send your response directly to the user without using the `final_answer` tool.
- Note that if the user tries to hold a conversation with you, try to respond in an engaging manner and answer them like a friend to their message, do not add anything unneccesary.


### Example Scenarios:

1. **Incomplete Task Provided**:
   - **Variable `Incomplete Tasks`**: 'Speak about the importance of mental health in a community seminar.'
   - **Assistant**:
     Construct the response: "You have an unfinished task: 'Speak about the importance of mental health in a community seminar.' Please complete it before starting a new one."
     Use `final_answer` to send the response.

2. **No Incomplete Task**:
   - **Variable `Incomplete Tasks`**: `NULL`
   - **Assistant**:
     Use the `generate_scenario` tool to create a new task.
     Construct the response: "Here's your new task: 'Deliver a speech on the impact of technology in education at a university lecture.'"
     Use `final_answer` to send the response.

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
     Use `final_answer` to send the response.

4. **Error Handling**:
   - **Assistant**:
     Construct the response: "Oops, something went wrong. Please try again after some time."
     Use `final_answer` to send the response.

Stay interactive, engaging, and proactive in assisting the user with their public speaking journey!

'''


system_prompt = PromptTemplate(
        input_variables=['Username', 'user_id', 'Incomplete Tasks'],
        template=template
    )

prompt = ChatPromptTemplate.from_messages([
  ("system", system_prompt.format(username='tharun', user_id='1', incomplete_tasks='NULL')),
  MessagesPlaceholder(variable_name="chat_history"),
  ("user", "{input}"),
  ("assistant", "scratchpad: {scratchpad}"),
])

tools = [
    generate_scenario,
    review_speech,
    final_answer
]

def create_scratchpad(intermediate_steps: list[AgentAction]):
    research_steps = []
    for i, action in enumerate(intermediate_steps):
        if action.log != "TBD":
            # this was the ToolExecution
            research_steps.append(
                f"Tool: {action.tool}, input: {action.tool_input}\n"
                f"Output: {action.log}"
            )
    return "\n---\n".join(research_steps)

head = (
    {
        "input": lambda x: x["input"],
        "chat_history": lambda x: x["chat_history"],
        "scratchpad": lambda x: create_scratchpad(
            intermediate_steps=x["intermediate_steps"]
        ),
    }
    | prompt
    | llm.bind_tools(tools, tool_choice="auto")
)
## Define Nodes & Edges
def run_head(state: list):
    # print(f"intermediate_steps: {state['intermediate_steps']}")
    out = head.invoke(state)
    tool_name = out.tool_calls[0]["name"]
    tool_args = out.tool_calls[0]["args"]
    action_out = AgentAction(
        tool=tool_name,
        tool_input=tool_args,
        log="TBD"
    )
    return {
        "intermediate_steps": [action_out]
    }
def router(state: dict):
    if isinstance(state.get("intermediate_steps"), list) and state["intermediate_steps"]:
        return state["intermediate_steps"][-1].tool
    else:
        return "final_answer"

tool_str_to_func = {
    "generate_scenario":generate_scenario,
    "review_speech":review_speech,
    "final_answer": final_answer
}

def run_tool(state: list):
    # use this as helper function so we repeat less code
    tool_name = state["intermediate_steps"][-1].tool
    tool_args = state["intermediate_steps"][-1].tool_input
    # print(f"{tool_name}.invoke(input={tool_args})")
    # run tool
    out = tool_str_to_func[tool_name].invoke(input=tool_args)
    action_out = AgentAction(
        tool=tool_name,
        tool_input=tool_args,
        log=str(out)
    )
    return {"intermediate_steps": [action_out]}
## Define Nodes
from langgraph.graph import StateGraph, END

graph = StateGraph(AgentState)

graph.add_node("head",run_head)
# graph.add_node("user_auth_with_tasks",run_tool)
# graph.add_node("search_incomplete_task",run_tool)
graph.add_node("generate_scenario",run_tool)
graph.add_node("review_speech",run_tool)
graph.add_node("final_answer", run_tool)


graph.set_entry_point("head")
graph.add_conditional_edges(
    source="head", 
    path=router,
)

for tool_obj in tools:
    if tool_obj.name != "final_answer":
        graph.add_edge(tool_obj.name, "head")

graph.add_edge("final_answer",END)

runnable = graph.compile()

def AgentCall(query,chat_history):
    out = runnable.invoke({
        "input": query,
        "chat_history": chat_history,
    })
    return out["intermediate_steps"][-1].tool_input
