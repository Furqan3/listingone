from google import generativeai as genai
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv

load_dotenv()

class UserData(BaseModel):
    user_name: str = ""
    user_phone_number: str = ""
    user_email: str = ""
    user_contact_preference: str = ""
    user_buying_or_selling: str = ""
    user_property_address: str = ""
    user_property_type: str = ""
    user_year_built: str = ""
    user_square_footage: str = ""
    user_number_of_bedrooms: str = ""
    user_number_of_bathrooms: str = ""
    user_lot_size: str = ""
    user_recent_renovations_or_upgrades: str = ""
    user_current_condition_assessment: str = ""

def structure_response(history):
    """
    Extract structured user data from conversation history using Gemini
    """
    try:
        # Configure Gemini
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Create conversation context
        conversation_text = ""
        for message, role in history.items():
            conversation_text += f"{role}: {message}\n"
        
        # Create extraction prompt
        prompt = f"""
        Analyze the following conversation and extract user information into structured JSON format.
        
        Conversation:
        {conversation_text}
        
        Extract the following information if mentioned:
        - user_name: Full name of the user
        - user_phone_number: Phone number
        - user_email: Email address
        - user_contact_preference: How they prefer to be contacted
        - user_buying_or_selling: Whether they're buying or selling
        - user_property_address: Address of property (if selling)
        - user_property_type: Type of property (house, condo, etc.)
        - user_year_built: Year the property was built
        - user_square_footage: Square footage of property
        - user_number_of_bedrooms: Number of bedrooms
        - user_number_of_bathrooms: Number of bathrooms
        - user_lot_size: Size of the lot
        - user_recent_renovations_or_upgrades: Any recent renovations
        - user_current_condition_assessment: Condition of the property
        
        Return ONLY a JSON array with one user object. If information is not mentioned, use empty strings.
        Example format: [{"user_name": "John Smith", "user_email": "john@email.com", ...}]
        """
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name=os.getenv("GEMINI_MODEL", "gemini-pro")
        )
        
        # Generate structured response
        response = model.generate_content(prompt)
        
        # Clean and parse JSON
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Try to parse JSON
        try:
            parsed_data = json.loads(response_text)
            if isinstance(parsed_data, list) and len(parsed_data) > 0:
                return json.dumps(parsed_data)
            else:
                return json.dumps([{}])
        except json.JSONDecodeError:
            print(f"JSON parsing error. Raw response: {response_text}")
            return json.dumps([{}])
            
    except Exception as e:
        print(f"Error in structure_response: {e}")
        return json.dumps([{}])

def extract_key_info(history):
    """
    Quick extraction of key contact information with improved pattern matching
    """
    try:
        conversation_text = ""
        for message, role in history.items():
            conversation_text += f"{role}: {message}\n"

        # Look for patterns in the conversation
        info = {
            "has_name": False,
            "has_email": False,
            "has_phone": False,
            "lead_type": "",
            "completion_score": 0,
            "extracted_name": "",
            "extracted_email": "",
            "extracted_phone": ""
        }

        conversation_lower = conversation_text.lower()

        # Check for email patterns
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, conversation_text)
        if email_match:
            info["has_email"] = True
            info["extracted_email"] = email_match.group()
            info["completion_score"] += 25

        # Check for phone patterns (improved)
        phone_pattern = r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}|\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})'
        phone_match = re.search(phone_pattern, conversation_text)
        if phone_match:
            info["has_phone"] = True
            info["extracted_phone"] = phone_match.group()
            info["completion_score"] += 25

        # Check for names (improved heuristic)
        name_patterns = [
            r"my name is ([A-Za-z\s]+)",
            r"i'm ([A-Za-z\s]+)",
            r"i am ([A-Za-z\s]+)",
            r"call me ([A-Za-z\s]+)",
            r"this is ([A-Za-z\s]+)"
        ]

        for pattern in name_patterns:
            name_match = re.search(pattern, conversation_lower)
            if name_match:
                info["has_name"] = True
                info["extracted_name"] = name_match.group(1).strip().title()
                info["completion_score"] += 25
                break

        # Check for lead type (improved)
        seller_keywords = ["sell", "selling", "list my house", "list my home", "put my house on the market", "want to sell"]
        buyer_keywords = ["buy", "buying", "looking for", "want to purchase", "house hunting", "home shopping", "looking to buy"]

        if any(keyword in conversation_lower for keyword in seller_keywords):
            info["lead_type"] = "seller"
            info["completion_score"] += 25
        elif any(keyword in conversation_lower for keyword in buyer_keywords):
            info["lead_type"] = "buyer"
            info["completion_score"] += 25

        return info

    except Exception as e:
        print(f"Error in extract_key_info: {e}")
        return {"has_name": False, "has_email": False, "has_phone": False, "lead_type": "", "completion_score": 0}

if __name__ == "__main__":
    # Test the function
    test_history = {
        "Hi! I'm your ListingOne.ai assistant. What's your name?": "assistant",
        "My name is John Smith": "user",
        "Great to meet you, John! What's your email address?": "assistant",
        "It's john.smith@email.com": "user",
        "Perfect! And your phone number?": "assistant",
        "555-123-4567": "user",
        "Thanks! Are you looking to buy or sell?": "assistant",
        "I want to sell my house": "user"
    }
    
    result = structure_response(test_history)
    print("Structured data:", result)
    
    key_info = extract_key_info(test_history)
    print("Key info:", key_info)