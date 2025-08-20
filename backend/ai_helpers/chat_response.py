try:
    from google import generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    # Mock for testing when Google Generative AI is not available
    class MockGenAI:
        @staticmethod
        def configure(api_key):
            # Mock configuration - api_key is ignored in testing
            pass

        class GenerativeModel:
            def __init__(self, model_name, system_instruction=None):
                self.model_name = model_name
                self.system_instruction = system_instruction

            def generate_content(self, prompt):
                # Mock response based on prompt content
                class MockResponse:
                    def __init__(self, text):
                        self.text = text

                # Improved mock responses that progress the conversation
                prompt_lower = prompt.lower()

                # Check if user provided name
                if any(word in prompt_lower for word in ["my name is", "i'm", "i am", "call me"]) or (len(prompt.split()) <= 3 and not "@" in prompt and not any(char.isdigit() for char in prompt)):
                    if "@" not in prompt and not any(char.isdigit() for char in prompt):
                        return MockResponse("Nice to meet you! What's the best email address where I can reach you?")

                # Check if user provided email
                elif "@" in prompt and "." in prompt:
                    return MockResponse("Perfect! And what's your phone number so we can follow up with you?")

                # Check if user provided phone
                elif any(char.isdigit() for char in prompt) and len([c for c in prompt if c.isdigit()]) >= 7:
                    return MockResponse("Great! Are you looking to buy or sell a property?")

                # Check if user specified buy/sell intent
                elif "buy" in prompt_lower or "purchase" in prompt_lower:
                    return MockResponse("Excellent! I can help you find the perfect property. What type of property are you looking for? (house, condo, townhouse, etc.)")
                elif "sell" in prompt_lower:
                    return MockResponse("Great! I can help you sell your property. What type of property are you looking to sell?")

                # Property type response
                elif any(prop_type in prompt_lower for prop_type in ["house", "condo", "apartment", "townhouse", "property"]):
                    return MockResponse("Perfect! What's your budget range for this property?")

                # Budget response
                elif any(budget_word in prompt_lower for budget_word in ["$", "dollar", "thousand", "k", "budget", "price"]) or any(char.isdigit() for char in prompt):
                    return MockResponse("Excellent! Thank you for providing all that information. I have everything I need to get started helping you. One of our expert agents will contact you within 24 hours to discuss your needs in detail. Is there anything else you'd like to know about our services?")

                # Default first message
                else:
                    return MockResponse("Hi! I'm AIREA, your AI Real Estate Assistant. 👋 To get started, what's your name?")

    genai = MockGenAI()
    GENAI_AVAILABLE = False

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
    system_prompt_path = os.getenv("SYSTEM_PROMPT_PATH", "system_prompt.txt")
    try:
        with open(system_prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = """
        You are AIREA, a professional AI Real Estate Assistant for ListingOne.ai.

        CONVERSATION OBJECTIVES:
        1. Collect complete user information for lead generation
        2. Understand their real estate needs
        3. Provide helpful guidance and insights

        REQUIRED INFORMATION TO COLLECT (in order):
        1. Full Name
        2. Email Address
        3. Phone Number
        4. Intent (Buying or Selling)
        5. Property details

        CONVERSATION FLOW RULES:
        - Ask ONE question at a time
        - Always acknowledge what the user just shared before asking the next question
        - Keep responses concise (under 50 words when collecting data)
        - Be natural and conversational, not robotic
        - Use their name once you know it
        - Progress through the flow naturally based on what information you already have

        CONVERSATION FLOW:
        1. GREETING: Welcome them and ask for their name
        2. EMAIL: Once you have their name, ask for their email
        3. PHONE: Once you have email, ask for their phone number
        4. INTENT: Ask if they're looking to buy or sell
        5. PROPERTY DETAILS: Ask about location, type, budget/timeline
        6. CONSULTATION: Offer to schedule a consultation
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