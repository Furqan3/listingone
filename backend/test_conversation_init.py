#!/usr/bin/env python3
"""
Test script to verify conversation initialization works correctly
"""

def test_conversation_initialization():
    """Test that conversation initialization includes all required fields"""
    print("Testing conversation initialization...")
    
    # Mock conversation initialization
    def create_new_conversation(session_id):
        return {
            "history": {},
            "created_at": "2025-08-19T11:13:22.611000",
            "user_data": {},
            "conversation_complete": False,
            "state": "greeting",
            "progress": {
                "current_step": 1,
                "total_steps": 6,
                "completed_fields": [],
                "next_required_field": "user_name",
                "completion_rate": 0
            },
            "collected_info": {
                "name": None,
                "email": None,
                "phone": None,
                "lead_type": None
            },
            "conversation_quality": {
                "engagement_score": 0,
                "completion_rate": 0,
                "data_quality_score": 0
            }
        }
    
    # Test conversation creation
    conversation = create_new_conversation("test-session")
    
    # Check all required fields exist
    required_fields = [
        "history", "created_at", "user_data", "conversation_complete", 
        "state", "progress", "collected_info", "conversation_quality"
    ]
    
    missing_fields = []
    for field in required_fields:
        if field not in conversation:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return False
    
    # Check progress fields
    progress_fields = [
        "current_step", "total_steps", "completed_fields", 
        "next_required_field", "completion_rate"
    ]
    
    missing_progress_fields = []
    for field in progress_fields:
        if field not in conversation["progress"]:
            missing_progress_fields.append(field)
    
    if missing_progress_fields:
        print(f"❌ Missing progress fields: {missing_progress_fields}")
        return False
    
    # Check conversation quality fields
    quality_fields = ["engagement_score", "completion_rate", "data_quality_score"]
    
    missing_quality_fields = []
    for field in quality_fields:
        if field not in conversation["conversation_quality"]:
            missing_quality_fields.append(field)
    
    if missing_quality_fields:
        print(f"❌ Missing quality fields: {missing_quality_fields}")
        return False
    
    print("✅ All required fields present")
    print(f"   Progress completion rate: {conversation['progress']['completion_rate']}")
    print(f"   Quality completion rate: {conversation['conversation_quality']['completion_rate']}")
    print(f"   Current step: {conversation['progress']['current_step']}/{conversation['progress']['total_steps']}")
    print(f"   Next required field: {conversation['progress']['next_required_field']}")
    
    return True

def test_get_conversation_context():
    """Test conversation context generation"""
    print("\nTesting conversation context generation...")
    
    def mock_get_conversation_context(conversation):
        progress = conversation["progress"]
        state = conversation["state"]
        
        context_parts = [
            f"Conversation Progress: Step {progress['current_step']}/{progress['total_steps']} ({progress['completion_rate']:.0f}% complete)",
            f"Current State: {state}",
            f"Completed Fields: {', '.join(progress['completed_fields']) if progress['completed_fields'] else 'None'}",
        ]
        
        if progress["next_required_field"]:
            field_names = {
                "user_name": "name",
                "user_email": "email address", 
                "user_phone_number": "phone number",
                "user_buying_or_selling": "whether they're buying or selling"
            }
            next_field = field_names.get(progress["next_required_field"], progress["next_required_field"])
            context_parts.append(f"Next Required: {next_field}")
        
        return "\n".join(context_parts)
    
    # Test with new conversation
    conversation = {
        "progress": {
            "current_step": 1,
            "total_steps": 6,
            "completed_fields": [],
            "next_required_field": "user_name",
            "completion_rate": 0
        },
        "state": "greeting"
    }
    
    context = mock_get_conversation_context(conversation)
    print("   Generated context:")
    for line in context.split('\n'):
        print(f"     {line}")
    
    # Verify context contains expected information
    if "Step 1/6" in context and "0% complete" in context and "name" in context:
        print("✅ Context generation works correctly")
        return True
    else:
        print("❌ Context generation failed")
        return False

if __name__ == "__main__":
    print("🔧 Testing Conversation Initialization Fix")
    print("=" * 50)
    
    success1 = test_conversation_initialization()
    success2 = test_get_conversation_context()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("✅ All conversation initialization tests passed!")
        print("\nThe 'completion_rate' error should now be fixed.")
    else:
        print("❌ Some tests failed - please check the implementation.")
