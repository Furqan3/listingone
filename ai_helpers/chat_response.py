from google import genai
import os
from dotenv import load_dotenv


def chat_response(history, user_input):
    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    systempromt = open(os.getenv("SYSTEM_PROMPT_PATH"), "r").read()
    history[user_input] = "user"
    prompt = f"history: {history}\nuser: {user_input}\nassistant:"
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL"),
        config=genai.types.GenerateContentConfig(
            system_instruction=systempromt),
        contents=prompt
    )
    history[response.text] = "assistant"
    return response.text



if __name__ == "__main__":
    history = {}
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        result = chat_response(history, user_input)
        print(f"AI: {result}")
        history[user_input] = "user"
        history[result] = "assistant"