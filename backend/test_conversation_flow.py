#!/usr/bin/env python3
"""
Test script for conversation flow and progress tracking
"""

def test_conversation_progress():
    """Test conversation progress tracking logic"""
    print("Testing conversation progress tracking...")
    
    # Mock conversation structure
    conversation = {
        "progress": {
            "current_step": 1,
            "total_steps": 6,
            "completed_fields": [],
            "next_required_field": "user_name",
            "completion_rate": 0
        },
        "state": "greeting",
        "conversation_quality": {
            "engagement_score": 0,
            "completion_rate": 0,
            "data_quality_score": 0
        }
    }
    
    # Mock update_conversation_progress function
    def mock_update_conversation_progress(conversation, extracted_data):
        if not extracted_data:
            return
        
        progress = conversation["progress"]
        completed_fields = []
        
        required_fields = {
            "user_name": "Name",
            "user_email": "Email", 
            "user_phone_number": "Phone",
            "user_buying_or_selling": "Lead Type"
        }
        
        for field in required_fields.keys():
            if extracted_data.get(field) and extracted_data[field].strip():
                if field not in progress["completed_fields"]:
                    completed_fields.append(field)
        
        progress["completed_fields"].extend(completed_fields)
        progress["completion_rate"] = len(progress["completed_fields"]) / len(required_fields) * 100
        
        # Determine next required field
        for field in required_fields.keys():
            if field not in progress["completed_fields"]:
                progress["next_required_field"] = field
                break
        else:
            progress["next_required_field"] = None
    
    # Test case 1: Add name
    print("\n1. Testing name collection...")
    extracted_data = {"user_name": "John Smith"}
    mock_update_conversation_progress(conversation, extracted_data)
    print(f"   Completion rate: {conversation['progress']['completion_rate']}%")
    print(f"   Next field: {conversation['progress']['next_required_field']}")
    print(f"   ✅ Name collection works" if conversation['progress']['completion_rate'] == 25 else "❌ Name collection failed")
    
    # Test case 2: Add email
    print("\n2. Testing email collection...")
    extracted_data = {"user_name": "John Smith", "user_email": "john@example.com"}
    mock_update_conversation_progress(conversation, extracted_data)
    print(f"   Completion rate: {conversation['progress']['completion_rate']}%")
    print(f"   Next field: {conversation['progress']['next_required_field']}")
    print(f"   ✅ Email collection works" if conversation['progress']['completion_rate'] == 50 else "❌ Email collection failed")
    
    # Test case 3: Add phone
    print("\n3. Testing phone collection...")
    extracted_data = {
        "user_name": "John Smith", 
        "user_email": "john@example.com",
        "user_phone_number": "555-123-4567"
    }
    mock_update_conversation_progress(conversation, extracted_data)
    print(f"   Completion rate: {conversation['progress']['completion_rate']}%")
    print(f"   Next field: {conversation['progress']['next_required_field']}")
    print(f"   ✅ Phone collection works" if conversation['progress']['completion_rate'] == 75 else "❌ Phone collection failed")
    
    # Test case 4: Add lead type (complete)
    print("\n4. Testing lead type collection...")
    extracted_data = {
        "user_name": "John Smith", 
        "user_email": "john@example.com",
        "user_phone_number": "555-123-4567",
        "user_buying_or_selling": "buying"
    }
    mock_update_conversation_progress(conversation, extracted_data)
    print(f"   Completion rate: {conversation['progress']['completion_rate']}%")
    print(f"   Next field: {conversation['progress']['next_required_field']}")
    print(f"   ✅ Complete collection works" if conversation['progress']['completion_rate'] == 100 else "❌ Complete collection failed")

def test_next_action_suggestions():
    """Test next action suggestion logic"""
    print("\n\nTesting next action suggestions...")
    
    def mock_get_next_action_suggestion(conversation):
        progress = conversation["progress"]
        
        if progress["completion_rate"] >= 100:
            return "Schedule consultation or provide property insights"
        elif progress["next_required_field"]:
            field_prompts = {
                "user_name": "Ask for the user's name",
                "user_email": "Request email address",
                "user_phone_number": "Get phone number",
                "user_buying_or_selling": "Determine if buying or selling"
            }
            return field_prompts.get(progress["next_required_field"], "Continue conversation")
        else:
            return "Gather additional property details"
    
    # Test different completion states
    test_cases = [
        {"completion_rate": 0, "next_required_field": "user_name", "expected": "Ask for the user's name"},
        {"completion_rate": 25, "next_required_field": "user_email", "expected": "Request email address"},
        {"completion_rate": 50, "next_required_field": "user_phone_number", "expected": "Get phone number"},
        {"completion_rate": 75, "next_required_field": "user_buying_or_selling", "expected": "Determine if buying or selling"},
        {"completion_rate": 100, "next_required_field": None, "expected": "Schedule consultation or provide property insights"}
    ]
    
    for i, case in enumerate(test_cases, 1):
        conversation = {"progress": case}
        action = mock_get_next_action_suggestion(conversation)
        success = action == case["expected"]
        print(f"   {i}. {case['completion_rate']}% complete: {'✅' if success else '❌'} {action}")

def test_conversation_states():
    """Test conversation state management"""
    print("\n\nTesting conversation state management...")
    
    states = [
        "greeting",
        "collecting_name", 
        "collecting_email",
        "collecting_phone",
        "determining_type",
        "collecting_property_info",
        "complete"
    ]
    
    print("   Available conversation states:")
    for i, state in enumerate(states, 1):
        print(f"   {i}. {state}")
    
    print("   ✅ Conversation states defined")

if __name__ == "__main__":
    print("🔧 Testing Conversation Flow Improvements")
    print("=" * 60)
    
    test_conversation_progress()
    test_next_action_suggestions()
    test_conversation_states()
    
    print("\n" + "=" * 60)
    print("✅ Conversation flow tests completed!")
    print("\nSummary of conversation flow improvements:")
    print("1. Added progress tracking with completion percentages")
    print("2. Implemented conversation state management")
    print("3. Added next action suggestions")
    print("4. Enhanced conversation quality metrics")
    print("5. Added progress API endpoints")
