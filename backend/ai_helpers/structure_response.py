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
                # Mock response for data extraction
                class MockResponse:
                    def __init__(self, text):
                        self.text = text

                # Extract data from prompt for testing
                mock_data = {"user_name": "", "user_email": "", "user_phone_number": "", "user_buying_or_selling": ""}

                # Simple pattern matching for testing
                if "john" in prompt.lower():
                    mock_data["user_name"] = "John Smith"
                if "@" in prompt:
                    import re
                    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', prompt)
                    if email_match:
                        mock_data["user_email"] = email_match.group()
                if any(char.isdigit() for char in prompt):
                    import re
                    phone_match = re.search(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})', prompt)
                    if phone_match:
                        mock_data["user_phone_number"] = phone_match.group()
                if "sell" in prompt.lower():
                    mock_data["user_buying_or_selling"] = "selling"
                elif "buy" in prompt.lower():
                    mock_data["user_buying_or_selling"] = "buying"

                return MockResponse(json.dumps([mock_data]))

    genai = MockGenAI()
    GENAI_AVAILABLE = False

from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv

load_dotenv()

def _get_empty_user_data():
    """Return empty user data structure with all required fields"""
    return {
        # Contact Information
        "user_name": "",
        "user_phone_number": "",
        "user_email": "",
        "user_contact_preference": "",

        # Intent and Type
        "user_buying_or_selling": "",
        "user_timeline": "",
        "user_urgency": "",
        "user_experience_level": "",

        # Property Information (for sellers)
        "user_property_address": "",
        "user_property_type": "",
        "user_year_built": "",
        "user_square_footage": "",
        "user_number_of_bedrooms": "",
        "user_number_of_bathrooms": "",
        "user_lot_size": "",
        "user_recent_renovations_or_upgrades": "",
        "user_current_condition_assessment": "",

        # Buyer Preferences
        "user_target_areas": "",
        "user_budget_range": "",
        "user_property_preferences": "",
        "user_financing_status": "",

        # Additional Context
        "user_motivation": "",
        "user_concerns": ""
    }

def _normalize_user_data(data):
    """Normalize user data to ensure all fields exist with proper defaults"""
    empty_data = _get_empty_user_data()

    # Update with provided data, ensuring all fields exist
    for key in empty_data.keys():
        if key in data and data[key] is not None:
            # Clean and validate the data
            value = str(data[key]).strip()
            empty_data[key] = value
        # else keep empty string default

    return empty_data

def _extract_data_with_regex(text):
    """Fallback method to extract data using regex patterns"""
    import re

    data = _get_empty_user_data()
    text_lower = text.lower()

    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text)
    if email_match:
        data["user_email"] = email_match.group()

    # Phone pattern
    phone_pattern = r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})'
    phone_match = re.search(phone_pattern, text)
    if phone_match:
        data["user_phone_number"] = phone_match.group()

    # Name patterns
    name_patterns = [
        r'"user_name":\s*"([^"]+)"',
        r'"name":\s*"([^"]+)"',
        r'name["\']?\s*:\s*["\']([^"\']+)["\']'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["user_name"] = match.group(1).strip()
            break

    # Buying/selling patterns
    if any(word in text_lower for word in ['sell', 'selling', 'seller']):
        data["user_buying_or_selling"] = "selling"
    elif any(word in text_lower for word in ['buy', 'buying', 'buyer']):
        data["user_buying_or_selling"] = "buying"

    return data

def validate_user_data(data):
    """Validate the quality of collected user data"""
    import re

    validation_results = {
        "is_valid": True,
        "issues": [],
        "completeness_score": 0,
        "quality_score": 0
    }

    # Check for required fields
    required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
    completed_required = 0

    for field in required_fields:
        if data.get(field) and data[field].strip():
            completed_required += 1
        else:
            validation_results["issues"].append(f"Missing {field}")

    validation_results["completeness_score"] = (completed_required / len(required_fields)) * 100

    # Validate email format
    if data.get("user_email"):
        email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        if not re.match(email_pattern, data["user_email"]):
            validation_results["issues"].append("Invalid email format")
            validation_results["quality_score"] -= 20

    # Validate phone number format
    if data.get("user_phone_number"):
        phone_clean = re.sub(r'[^\d]', '', data["user_phone_number"])
        if len(phone_clean) < 10 or len(phone_clean) > 11:
            validation_results["issues"].append("Invalid phone number format")
            validation_results["quality_score"] -= 20

    # Check for fake/test data
    if data.get("user_name"):
        name_lower = data["user_name"].lower()
        fake_names = ["test", "fake", "abc", "xyz", "john doe", "jane doe", "asdf"]
        if any(fake in name_lower for fake in fake_names):
            validation_results["issues"].append("Potentially fake name")
            validation_results["quality_score"] -= 30

    if data.get("user_email"):
        email_lower = data["user_email"].lower()
        fake_emails = ["test@", "fake@", "example@", "@test", "@fake"]
        if any(fake in email_lower for fake in fake_emails):
            validation_results["issues"].append("Potentially fake email")
            validation_results["quality_score"] -= 30

    # Calculate overall quality score
    base_quality = 100
    validation_results["quality_score"] = max(0, base_quality + validation_results["quality_score"])

    # Determine if data is valid for lead generation
    validation_results["is_valid"] = (
        validation_results["completeness_score"] >= 75 and
        validation_results["quality_score"] >= 60 and
        len(validation_results["issues"]) <= 2
    )

    return validation_results

def detect_duplicate_lead(new_data, existing_conversations):
    """Detect if this is a duplicate lead based on email/phone"""
    if not new_data:
        return {"is_duplicate": False, "confidence": 0, "matching_sessions": []}

    email = new_data.get("user_email", "").lower().strip()
    phone = new_data.get("user_phone_number", "").strip()
    name = new_data.get("user_name", "").lower().strip()

    matches = []

    for session_id, conversation in existing_conversations.items():
        if not conversation.get("user_data"):
            continue

        existing_data = conversation["user_data"]
        existing_email = existing_data.get("user_email", "").lower().strip()
        existing_phone = existing_data.get("user_phone_number", "").strip()
        existing_name = existing_data.get("user_name", "").lower().strip()

        match_score = 0
        match_reasons = []

        # Email match (high confidence)
        if email and existing_email and email == existing_email:
            match_score += 80
            match_reasons.append("email_exact_match")

        # Phone match (high confidence)
        if phone and existing_phone:
            # Clean phone numbers for comparison
            clean_phone = ''.join(filter(str.isdigit, phone))
            clean_existing = ''.join(filter(str.isdigit, existing_phone))
            if len(clean_phone) >= 10 and clean_phone == clean_existing:
                match_score += 80
                match_reasons.append("phone_exact_match")

        # Name similarity (lower confidence)
        if name and existing_name and len(name) > 2:
            if name == existing_name:
                match_score += 40
                match_reasons.append("name_exact_match")
            elif name in existing_name or existing_name in name:
                match_score += 20
                match_reasons.append("name_partial_match")

        if match_score >= 60:  # Threshold for considering it a duplicate
            matches.append({
                "session_id": session_id,
                "confidence": match_score,
                "reasons": match_reasons,
                "created_at": conversation.get("created_at")
            })

    # Sort by confidence (highest first)
    matches.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "is_duplicate": len(matches) > 0,
        "confidence": matches[0]["confidence"] if matches else 0,
        "matching_sessions": matches[:3]  # Return top 3 matches
    }

def detect_spam_patterns(data):
    """Detect common spam patterns in user data"""
    spam_indicators = []
    spam_score = 0

    if not data:
        return {"is_spam": False, "score": 0, "indicators": []}

    name = data.get("user_name", "").lower()
    email = data.get("user_email", "").lower()
    phone = data.get("user_phone_number", "")

    # Check for common spam patterns
    spam_names = ["test", "fake", "spam", "bot", "admin", "null", "undefined", "asdf", "qwerty"]
    if any(spam_name in name for spam_name in spam_names):
        spam_indicators.append("suspicious_name")
        spam_score += 30

    # Check for disposable email domains
    disposable_domains = ["10minutemail", "tempmail", "guerrillamail", "mailinator", "throwaway"]
    if any(domain in email for domain in disposable_domains):
        spam_indicators.append("disposable_email")
        spam_score += 40

    # Check for invalid phone patterns
    if phone:
        clean_phone = ''.join(filter(str.isdigit, phone))
        if len(clean_phone) < 10:
            spam_indicators.append("invalid_phone_length")
            spam_score += 20
        elif clean_phone == "1234567890" or clean_phone == "0000000000":
            spam_indicators.append("fake_phone_pattern")
            spam_score += 35

    # Check for repeated characters
    if name and len(set(name.replace(" ", ""))) <= 2:
        spam_indicators.append("repeated_characters")
        spam_score += 25

    # Check for gibberish patterns
    if name and len(name) > 3:
        vowels = sum(1 for char in name if char in 'aeiou')
        consonants = sum(1 for char in name if char.isalpha() and char not in 'aeiou')
        if vowels == 0 and consonants > 3:
            spam_indicators.append("no_vowels")
            spam_score += 20

    return {
        "is_spam": spam_score >= 50,
        "score": spam_score,
        "indicators": spam_indicators
    }

def calculate_lead_score(data, conversation_data=None):
    """Calculate comprehensive lead score based on multiple factors"""
    if not data:
        return {"total_score": 0, "category": "Cold", "breakdown": {}}

    score_breakdown = {
        "data_completeness": 0,
        "timeline_urgency": 0,
        "budget_qualification": 0,
        "engagement_level": 0,
        "experience_bonus": 0
    }

    # 1. Data Completeness (0-40 points)
    required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
    completed_required = sum(1 for field in required_fields if data.get(field, "").strip())
    score_breakdown["data_completeness"] = (completed_required / len(required_fields)) * 40

    # Additional data points (bonus points)
    bonus_fields = ["user_property_address", "user_budget_range", "user_target_areas", "user_motivation"]
    completed_bonus = sum(1 for field in bonus_fields if data.get(field, "").strip())
    score_breakdown["data_completeness"] += min(10, completed_bonus * 2.5)

    # 2. Timeline Urgency (0-25 points)
    timeline = data.get("user_timeline", "").lower()
    urgency = data.get("user_urgency", "").lower()

    urgency_keywords = {
        "asap": 25, "urgent": 25, "immediately": 25, "this week": 25,
        "this month": 20, "next month": 18, "within 30 days": 18,
        "this year": 15, "6 months": 12, "next year": 8,
        "just exploring": 3, "no rush": 2, "someday": 1
    }

    timeline_score = 0
    for keyword, points in urgency_keywords.items():
        if keyword in timeline or keyword in urgency:
            timeline_score = max(timeline_score, points)
            break

    score_breakdown["timeline_urgency"] = timeline_score

    # 3. Budget Qualification (0-20 points)
    budget = data.get("user_budget_range", "").lower()
    financing = data.get("user_financing_status", "").lower()

    budget_score = 0
    if budget:
        # Look for specific budget mentions
        import re
        budget_numbers = re.findall(r'\$?(\d+(?:,\d{3})*(?:k|000)?)', budget)
        if budget_numbers:
            budget_score += 10  # Has specific budget

        if "pre-approved" in financing or "pre-qualified" in financing:
            budget_score += 10  # Has financing ready
        elif "cash" in budget or "cash buyer" in financing:
            budget_score += 15  # Cash buyer (premium)
        elif "need financing" in financing or "looking for lender" in financing:
            budget_score += 5   # Needs financing help

    score_breakdown["budget_qualification"] = budget_score

    # 4. Engagement Level (0-15 points)
    engagement_score = 0
    if conversation_data:
        message_count = len(conversation_data.get("history", {}))
        engagement_score = min(15, message_count * 2)  # 2 points per message, max 15

        # Bonus for detailed responses
        concerns = data.get("user_concerns", "")
        motivation = data.get("user_motivation", "")
        if len(concerns) > 20 or len(motivation) > 20:
            engagement_score += 3

    score_breakdown["engagement_level"] = engagement_score

    # 5. Experience Bonus (0-5 points)
    experience = data.get("user_experience_level", "").lower()
    if "first time" in experience or "new to this" in experience:
        score_breakdown["experience_bonus"] = 5  # First-time buyers/sellers often more committed
    elif "experienced" in experience or "done this before" in experience:
        score_breakdown["experience_bonus"] = 3  # Experienced but may be more selective

    # Calculate total score
    total_score = sum(score_breakdown.values())

    # Determine lead category
    if total_score >= 80:
        category = "Hot"
        priority = "Immediate"
    elif total_score >= 60:
        category = "Warm"
        priority = "Next Business Day"
    elif total_score >= 40:
        category = "Qualified"
        priority = "Within 3 Days"
    elif total_score >= 20:
        category = "Cold"
        priority = "Nurture Campaign"
    else:
        category = "Unqualified"
        priority = "No Follow-up"

    return {
        "total_score": round(total_score, 1),
        "category": category,
        "priority": priority,
        "breakdown": score_breakdown,
        "recommendations": _get_lead_recommendations(category, data)
    }

def _get_lead_recommendations(category, data):
    """Get specific recommendations based on lead category and data"""
    recommendations = []

    if category == "Hot":
        recommendations.append("Assign to top agent immediately")
        recommendations.append("Schedule consultation within 24 hours")
        if data.get("user_buying_or_selling") == "selling":
            recommendations.append("Prepare CMA (Comparative Market Analysis)")
        else:
            recommendations.append("Prepare buyer consultation packet")

    elif category == "Warm":
        recommendations.append("Agent follow-up within 1 business day")
        recommendations.append("Send relevant market information")
        if not data.get("user_budget_range"):
            recommendations.append("Qualify budget and financing")

    elif category == "Qualified":
        recommendations.append("Add to nurture sequence")
        recommendations.append("Send educational content")
        if not data.get("user_timeline"):
            recommendations.append("Clarify timeline and urgency")

    elif category == "Cold":
        recommendations.append("Add to long-term nurture campaign")
        recommendations.append("Send monthly market updates")

    else:  # Unqualified
        recommendations.append("Verify contact information")
        recommendations.append("Re-engage with value content")

    return recommendations

def analyze_conversation_sentiment(history):
    """Analyze sentiment and engagement level from conversation"""
    if not history:
        return {"sentiment": "neutral", "engagement": "low", "confidence": 0}

    # Combine all user messages
    user_messages = [msg for msg, role in history.items() if role == "user"]
    conversation_text = " ".join(user_messages).lower()

    # Simple sentiment analysis using keyword patterns
    positive_keywords = [
        "great", "excellent", "perfect", "love", "amazing", "fantastic", "wonderful",
        "excited", "interested", "ready", "yes", "definitely", "absolutely", "sure"
    ]

    negative_keywords = [
        "bad", "terrible", "awful", "hate", "frustrated", "annoyed", "disappointed",
        "no", "never", "not interested", "waste of time", "too expensive", "can't afford"
    ]

    urgency_keywords = [
        "asap", "urgent", "quickly", "soon", "immediately", "right away", "fast",
        "deadline", "time sensitive", "need to move", "have to sell"
    ]

    # Count keyword occurrences
    positive_count = sum(1 for word in positive_keywords if word in conversation_text)
    negative_count = sum(1 for word in negative_keywords if word in conversation_text)
    urgency_count = sum(1 for word in urgency_keywords if word in conversation_text)

    # Determine sentiment
    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Determine engagement level
    message_count = len(user_messages)
    avg_message_length = sum(len(msg) for msg in user_messages) / max(1, len(user_messages))

    if message_count >= 5 and avg_message_length > 20:
        engagement = "high"
    elif message_count >= 3 or avg_message_length > 15:
        engagement = "medium"
    else:
        engagement = "low"

    # Calculate confidence based on data available
    confidence = min(100, (message_count * 10) + (positive_count + negative_count) * 5)

    return {
        "sentiment": sentiment,
        "engagement": engagement,
        "urgency_level": "high" if urgency_count > 0 else "normal",
        "confidence": confidence,
        "metrics": {
            "message_count": message_count,
            "avg_message_length": round(avg_message_length, 1),
            "positive_signals": positive_count,
            "negative_signals": negative_count,
            "urgency_signals": urgency_count
        }
    }

def detect_conversation_intent(history, user_data=None):
    """Detect primary intent and sub-intents from conversation"""
    if not history:
        return {"primary_intent": "unknown", "sub_intents": [], "confidence": 0}

    user_messages = [msg for msg, role in history.items() if role == "user"]
    conversation_text = " ".join(user_messages).lower()

    # Intent patterns
    intent_patterns = {
        "sell_property": [
            "sell my house", "sell my home", "list my property", "want to sell",
            "selling my house", "put house on market", "get a valuation"
        ],
        "buy_property": [
            "buy a house", "buy a home", "looking to buy", "house hunting",
            "want to purchase", "looking for a house", "find a home"
        ],
        "get_valuation": [
            "what's my house worth", "property value", "market value", "appraisal",
            "how much is my house", "valuation", "estimate"
        ],
        "market_research": [
            "market conditions", "market trends", "property prices", "market analysis",
            "how's the market", "good time to sell", "good time to buy"
        ],
        "investment": [
            "investment property", "rental property", "flip house", "investment opportunity",
            "roi", "cash flow", "investment advice"
        ],
        "refinance": [
            "refinance", "refi", "lower rate", "mortgage rate", "loan modification"
        ]
    }

    # Detect intents
    detected_intents = []
    for intent, patterns in intent_patterns.items():
        matches = sum(1 for pattern in patterns if pattern in conversation_text)
        if matches > 0:
            detected_intents.append({
                "intent": intent,
                "confidence": min(100, matches * 25),
                "matches": matches
            })

    # Sort by confidence
    detected_intents.sort(key=lambda x: x["confidence"], reverse=True)

    # Determine primary intent
    primary_intent = detected_intents[0]["intent"] if detected_intents else "general_inquiry"

    # Get sub-intents (secondary intents with confidence > 25)
    sub_intents = [
        intent["intent"] for intent in detected_intents[1:]
        if intent["confidence"] > 25
    ]

    # Overall confidence
    overall_confidence = detected_intents[0]["confidence"] if detected_intents else 0

    return {
        "primary_intent": primary_intent,
        "sub_intents": sub_intents,
        "confidence": overall_confidence,
        "all_detected": detected_intents
    }

def identify_conversation_topics(history):
    """Identify main topics discussed in conversation"""
    if not history:
        return {"topics": [], "focus_areas": []}

    user_messages = [msg for msg, role in history.items() if role == "user"]
    conversation_text = " ".join(user_messages).lower()

    # Topic categories
    topic_keywords = {
        "pricing": ["price", "cost", "expensive", "cheap", "budget", "afford", "money", "dollar"],
        "location": ["area", "neighborhood", "city", "town", "district", "zone", "location", "where"],
        "property_features": ["bedroom", "bathroom", "kitchen", "garage", "yard", "pool", "basement"],
        "timeline": ["when", "time", "soon", "later", "month", "year", "deadline", "schedule"],
        "financing": ["loan", "mortgage", "bank", "credit", "down payment", "financing", "lender"],
        "market_conditions": ["market", "trend", "economy", "rates", "demand", "supply", "competition"],
        "property_condition": ["condition", "repair", "renovation", "upgrade", "maintenance", "new", "old"],
        "legal_process": ["contract", "closing", "inspection", "appraisal", "title", "deed", "legal"]
    }

    # Detect topics
    detected_topics = []
    for topic, keywords in topic_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in conversation_text)
        if matches > 0:
            detected_topics.append({
                "topic": topic,
                "relevance": matches,
                "keywords_found": [kw for kw in keywords if kw in conversation_text]
            })

    # Sort by relevance
    detected_topics.sort(key=lambda x: x["relevance"], reverse=True)

    # Get top topics
    topics = [topic["topic"] for topic in detected_topics[:5]]
    focus_areas = [topic["topic"] for topic in detected_topics if topic["relevance"] >= 2]

    return {
        "topics": topics,
        "focus_areas": focus_areas,
        "detailed_analysis": detected_topics
    }

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
        Look for information that may be mentioned naturally in conversation, not just direct answers to questions.

        Conversation:
        {conversation_text}

        Extract the following information if mentioned (directly or indirectly):

        CONTACT INFORMATION:
        - user_name: Full name of the user (look for "I'm John", "My name is", "This is Sarah", etc.)
        - user_phone_number: Phone number in any format
        - user_email: Email address
        - user_contact_preference: How they prefer to be contacted (email, phone, text)

        INTENT AND TYPE:
        - user_buying_or_selling: Whether they're buying or selling (look for "want to sell", "looking to buy", "house hunting", "list my home", etc.)
        - user_timeline: When they want to buy/sell ("ASAP", "next month", "this year", "just exploring")
        - user_urgency: Level of urgency ("urgent", "flexible", "no rush")
        - user_experience_level: First-time buyer/seller or experienced ("first time", "we've done this before", "new to this")

        PROPERTY INFORMATION (for sellers):
        - user_property_address: Full or partial address, city, neighborhood
        - user_property_type: Type of property (house, condo, townhome, etc.)
        - user_year_built: Year the property was built
        - user_square_footage: Square footage of property
        - user_number_of_bedrooms: Number of bedrooms (look for "3BR", "three bedroom", etc.)
        - user_number_of_bathrooms: Number of bathrooms
        - user_lot_size: Size of the lot
        - user_recent_renovations_or_upgrades: Any recent renovations
        - user_current_condition_assessment: Condition of the property

        BUYER PREFERENCES (for buyers):
        - user_target_areas: Areas or neighborhoods they're interested in
        - user_budget_range: Budget or price range mentioned
        - user_property_preferences: Size, type, features they want
        - user_financing_status: Pre-approval status, financing needs

        ADDITIONAL CONTEXT:
        - user_motivation: Why they're buying/selling (moving, downsizing, investment, etc.)
        - user_concerns: Any concerns or questions they've expressed

        Return ONLY a JSON array with one user object. If information is not mentioned, use empty strings.
        Pay special attention to natural language patterns like "my 3BR house in Dallas" or "looking for something under 500k in Austin".

        Example format: [{"user_name": "John Smith", "user_email": "john@email.com", "user_buying_or_selling": "selling", "user_number_of_bedrooms": "3", "user_property_address": "Dallas", ...}]
        """
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name=os.getenv("GEMINI_MODEL", "gemini-pro")
        )
        
        # Generate structured response
        response = model.generate_content(prompt)
        
        # Clean and parse JSON with robust error handling
        response_text = response.text.strip()

        # Remove various markdown code block formats
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]

        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # Try to parse JSON with multiple fallback strategies
        try:
            parsed_data = json.loads(response_text)

            # Validate and normalize the data structure
            if isinstance(parsed_data, list):
                if len(parsed_data) > 0 and isinstance(parsed_data[0], dict):
                    # Ensure all required fields exist with default values
                    normalized_data = _normalize_user_data(parsed_data[0])
                    return json.dumps([normalized_data])
                else:
                    return json.dumps([_get_empty_user_data()])
            elif isinstance(parsed_data, dict):
                # If AI returned a single object instead of array, wrap it
                normalized_data = _normalize_user_data(parsed_data)
                return json.dumps([normalized_data])
            else:
                print(f"Unexpected data type from AI: {type(parsed_data)}")
                return json.dumps([_get_empty_user_data()])

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {response_text[:200]}...")

            # Try to extract data using regex as fallback
            fallback_data = _extract_data_with_regex(response_text)
            return json.dumps([fallback_data])
            
    except Exception as e:
        print(f"Error in structure_response: {e}")
        # Return properly structured empty data instead of just {}
        return json.dumps([_get_empty_user_data()])

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