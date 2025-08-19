from google import generativeai as genai
import os
from dotenv import load_dotenv

def chat_response(history, user_input):
    """
    Generate AI chat response using Gemini
    """
    load_dotenv()
    
    # Configure Gemini
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Read system prompt
    system_prompt_path = os.getenv("SYSTEM_PROMPT_PATH", "stem_prompt.txt")
    try:
        with open(system_prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = """
        You are the official AI assistant for ListingOne.ai, a real estate platform.
        Your role is to collect complete user data for lead generation and CRM.

        PRIMARY OBJECTIVES:
        1. Collect Name, Email, and Phone Number FIRST
        2. Determine if they're a BUYER or SELLER
        3. Gather property-specific information
        4. Provide value through property insights
        5. Schedule consultations

        CONVERSATION FLOW:
        1. Greet and ask for NAME
        2. Ask for EMAIL
        3. Ask for PHONE
        4. Ask if BUYING or SELLING
        5. Collect property details based on type
        6. Offer consultation scheduling

        Keep responses conversational, helpful, and under 50 words when collecting data.
        Confirm each piece of information before proceeding.
        """
    
    # Add current interaction to history
    history[user_input] = "user"
    
    # Create conversation context
    conversation_context = ""
    for message, role in history.items():
        conversation_context += f"{role}: {message}\n"
    
    # Prepare the prompt
    prompt = f"System: {system_prompt}\n\nConversation History:\n{conversation_context}\n\nPlease respond as the ListingOne.ai assistant:"
    
    try:
        # Initialize the model
        model = genai.GenerativeModel(
            model_name=os.getenv("GEMINI_MODEL", "gemini-pro"),
            system_instruction=system_prompt
        )
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Add AI response to history
        ai_response = response.text
        history[ai_response] = "assistant"
        
        return ai_response
        
    except Exception as e:
        print(f"Error generating response: {e}")
        # Fallback response
        fallback_response = "I'm sorry, I'm having trouble connecting right now. Could you please try again in a moment?"
        history[fallback_response] = "assistant"
        return fallback_response

if __name__ == "__main__":
    # Test the function
    history = {}
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        result = chat_response(history, user_input)
        print(f"AI: {result}")
        print(f"History length: {len(history)}")