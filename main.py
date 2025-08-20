from ai_helpers.chat_response import chat_response
from ai_helpers.structure_response import structure_response

if __name__ == "__main__":
    history = {}
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print(structure_response(history))
            break
        result = chat_response(history, user_input)
        print(f"AI: {result}")
        history[user_input] = "user"
        history[result] = "assistant"