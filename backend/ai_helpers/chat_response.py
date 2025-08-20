from google import generativeai as genai
import os
from dotenv import load_dotenv

def chat_response(history, user_input, context=None):
    """
    Generate AI chat response using Gemini
    """
    load_dotenv()

    # Validate inputs
    if not user_input or not user_input.strip():
        return "I'm sorry, I didn't receive your message. Could you please try again?"

    if not isinstance(history, dict):
        history = {}

    # Validate API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment variables")
        return "I'm sorry, I'm having trouble connecting right now. Please check the configuration and try again."

    # Configure Gemini
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
        return "I'm sorry, I'm having trouble connecting to the AI service. Please try again in a moment."
    
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
    
    # Prepare the prompt with optional context
    context_section = f"\n\nConversation Context:\n{context}" if context else ""
    prompt = f"System: {system_prompt}{context_section}\n\nConversation History:\n{conversation_context}\n\nPlease respond as the ListingOne.ai assistant:"
    
    try:
        # Initialize the model
        model_name = os.getenv("GEMINI_MODEL", "gemini-pro")
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )

        # Generate response with timeout and validation
        response = model.generate_content(prompt)

        # Validate response
        if not response or not response.text:
            print("Warning: Empty response from Gemini")
            fallback_response = "I'm sorry, I didn't generate a proper response. Could you please rephrase your question?"
            history[fallback_response] = "assistant"
            return fallback_response

        # Add AI response to history
        ai_response = response.text.strip()
        if len(ai_response) > 2000:  # Reasonable limit for chat responses
            ai_response = ai_response[:2000] + "..."
            print("Warning: Response truncated due to length")

        history[ai_response] = "assistant"
        return ai_response

    except Exception as e:
        error_msg = str(e)
        print(f"Error generating response: {error_msg}")

        # Provide specific error messages for common issues
        if "api_key" in error_msg.lower():
            fallback_response = "I'm sorry, there's an issue with my API configuration. Please contact support."
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            fallback_response = "I'm sorry, I'm experiencing high demand right now. Please try again in a few minutes."
        elif "network" in error_msg.lower() or "connection" in error_msg.lower():
            fallback_response = "I'm sorry, I'm having network connectivity issues. Please try again in a moment."
        else:
            fallback_response = "I'm sorry, I'm having trouble processing your request right now. Could you please try again?"

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