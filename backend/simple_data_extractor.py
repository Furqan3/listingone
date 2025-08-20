"""
Simple data extraction functions for real-time conversation processing
"""

import re
import json

def extract_user_data_simple(conversation_history):
    """
    Simple, reliable data extraction from conversation history
    """
    # Initialize empty user data
    user_data = {
        "user_name": "",
        "user_phone_number": "",
        "user_email": "",
        "user_contact_preference": "",
        "user_buying_or_selling": "",
        "user_timeline": "",
        "user_urgency": "",
        "user_experience_level": "",
        "user_property_address": "",
        "user_property_type": "",
        "user_year_built": "",
        "user_square_footage": "",
        "user_number_of_bedrooms": "",
        "user_number_of_bathrooms": "",
        "user_lot_size": "",
        "user_recent_renovations_or_upgrades": "",
        "user_current_condition_assessment": "",
        "user_target_areas": "",
        "user_budget_range": "",
        "user_property_preferences": "",
        "user_financing_status": "",
        "user_motivation": "",
        "user_concerns": ""
    }
    
    # Combine all user messages
    user_messages = []
    for message, role in conversation_history.items():
        if role == "user":
            user_messages.append(message.lower())
    
    conversation_text = " ".join(user_messages)
    
    # Extract name
    name_patterns = [
        r"my name is ([a-zA-Z\s]+)",
        r"i'm ([a-zA-Z\s]+)",
        r"i am ([a-zA-Z\s]+)",
        r"call me ([a-zA-Z\s]+)",
        r"this is ([a-zA-Z\s]+)",
        r"name's ([a-zA-Z\s]+)"
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, conversation_text)
        if match:
            name = match.group(1).strip().title()
            # Filter out common words that aren't names
            if name and len(name) > 2 and name not in ["Interested", "Looking", "Here", "Good", "Fine", "Okay"]:
                user_data["user_name"] = name
                break

    # If no name found with patterns, check for standalone names in individual messages
    if not user_data["user_name"]:
        for message, role in conversation_history.items():
            if role == "user":
                message_clean = message.strip()
                # Check if message is likely just a name (2-30 chars, only letters and spaces)
                if (2 <= len(message_clean) <= 30 and
                    re.match(r'^[a-zA-Z\s]+$', message_clean) and
                    message_clean.lower() not in ['hi', 'hello', 'hey', 'yes', 'no', 'buy', 'sell', 'house', 'home', 'riaz']):
                    user_data["user_name"] = message_clean.title()
                    break
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, conversation_text)
    if email_match:
        user_data["user_email"] = email_match.group()
    
    # Extract phone
    phone_patterns = [
        r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})',
        r'(\d{10})',
        r'(\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})'
    ]
    
    for pattern in phone_patterns:
        phone_match = re.search(pattern, conversation_text)
        if phone_match:
            user_data["user_phone_number"] = phone_match.group()
            break
    
    # Extract buying/selling intent
    if any(word in conversation_text for word in ['sell', 'selling', 'seller', 'list my', 'put on market']):
        user_data["user_buying_or_selling"] = "selling"
    elif any(word in conversation_text for word in ['buy', 'buying', 'buyer', 'purchase', 'looking for', 'house hunt']):
        user_data["user_buying_or_selling"] = "buying"
    
    # Extract timeline
    if any(word in conversation_text for word in ['asap', 'immediately', 'urgent', 'right away', 'soon']):
        user_data["user_timeline"] = "ASAP"
    elif any(word in conversation_text for word in ['this month', 'next month', 'few weeks']):
        user_data["user_timeline"] = "1-2 months"
    elif any(word in conversation_text for word in ['this year', 'next year', '6 months']):
        user_data["user_timeline"] = "6-12 months"
    elif any(word in conversation_text for word in ['exploring', 'just looking', 'no rush']):
        user_data["user_timeline"] = "Just exploring"
    
    # Extract property type
    if any(word in conversation_text for word in ['house', 'single family', 'home']):
        user_data["user_property_type"] = "Single Family Home"
    elif any(word in conversation_text for word in ['condo', 'condominium']):
        user_data["user_property_type"] = "Condominium"
    elif any(word in conversation_text for word in ['townhouse', 'townhome']):
        user_data["user_property_type"] = "Townhouse"
    elif any(word in conversation_text for word in ['apartment', 'multi-family']):
        user_data["user_property_type"] = "Multi-Family"
    
    # Extract budget information
    budget_patterns = [
        r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
        r'(\d{1,3}(?:,\d{3})*)\s*(?:dollars?|k|thousand)',
        r'budget.*?(\d{1,3}(?:,\d{3})*)',
        r'afford.*?(\d{1,3}(?:,\d{3})*)'
    ]
    
    for pattern in budget_patterns:
        budget_match = re.search(pattern, conversation_text)
        if budget_match:
            user_data["user_budget_range"] = budget_match.group()
            break
    
    return user_data

def merge_user_data(existing_data, new_data):
    """
    Merge new data with existing data, preserving existing values
    """
    if not existing_data:
        return new_data
    
    merged = existing_data.copy()
    
    for key, value in new_data.items():
        if value and value.strip() and (not merged.get(key) or not merged[key].strip()):
            merged[key] = value
    
    return merged

def calculate_completion_percentage(user_data):
    """
    Calculate how complete the user data is
    """
    required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
    completed_required = sum(1 for field in required_fields if user_data.get(field, "").strip())
    
    optional_fields = ["user_timeline", "user_property_type", "user_budget_range"]
    completed_optional = sum(1 for field in optional_fields if user_data.get(field, "").strip())
    
    # Required fields are worth 80%, optional fields 20%
    completion_rate = (completed_required / len(required_fields)) * 80 + (completed_optional / len(optional_fields)) * 20
    
    return min(100, completion_rate)

def is_conversation_complete(user_data):
    """
    Check if we have enough information to consider the conversation complete
    """
    required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
    return all(user_data.get(field, "").strip() for field in required_fields)

def get_next_required_field(user_data):
    """
    Determine what information we need to collect next
    """
    if not user_data.get("user_name", "").strip():
        return "user_name"
    elif not user_data.get("user_email", "").strip():
        return "user_email"
    elif not user_data.get("user_phone_number", "").strip():
        return "user_phone_number"
    elif not user_data.get("user_buying_or_selling", "").strip():
        return "user_buying_or_selling"
    elif not user_data.get("user_timeline", "").strip():
        return "user_timeline"
    elif not user_data.get("user_property_type", "").strip():
        return "user_property_type"
    elif not user_data.get("user_budget_range", "").strip():
        return "user_budget_range"
    else:
        return None  # All information collected
