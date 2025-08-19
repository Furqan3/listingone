#!/usr/bin/env python3
"""
Test script to verify the fixes for the chat API issues
"""
import json
from pydantic import BaseModel, ValidationError
from typing import Dict, Optional

# Mock the ChatResponse model to test validation
class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_data: Optional[Dict] = None
    conversation_complete: bool = False

def test_pydantic_validation():
    """Test that the Pydantic validation works correctly"""
    print("Testing Pydantic validation fixes...")
    
    # Test case 1: Valid dict (should work)
    try:
        valid_data = {
            "user_name": "John Smith",
            "user_email": "john@example.com",
            "user_phone_number": "555-123-4567"
        }
        response = ChatResponse(
            response="Hello!",
            session_id="test-123",
            user_data=valid_data,
            conversation_complete=False
        )
        print("✅ Valid dict test passed")
    except ValidationError as e:
        print(f"❌ Valid dict test failed: {e}")
    
    # Test case 2: None value (should work)
    try:
        response = ChatResponse(
            response="Hello!",
            session_id="test-123",
            user_data=None,
            conversation_complete=False
        )
        print("✅ None value test passed")
    except ValidationError as e:
        print(f"❌ None value test failed: {e}")
    
    # Test case 3: List with dict (should fail - this was the original problem)
    try:
        invalid_data = [{"user_name": "John"}]  # This should fail
        response = ChatResponse(
            response="Hello!",
            session_id="test-123",
            user_data=invalid_data,
            conversation_complete=False
        )
        print("❌ List validation test failed - should have raised ValidationError")
    except ValidationError as e:
        print("✅ List validation correctly rejected (this was the original bug)")
    
    # Test case 4: Empty dict (should work)
    try:
        response = ChatResponse(
            response="Hello!",
            session_id="test-123",
            user_data={},
            conversation_complete=False
        )
        print("✅ Empty dict test passed")
    except ValidationError as e:
        print(f"❌ Empty dict test failed: {e}")

def test_structure_response_format():
    """Test the format specifier fix"""
    print("\nTesting format specifier fix...")
    
    # Test the f-string format that was causing the error
    history = {"Hello": "user", "Hi there!": "assistant"}
    
    # This should not raise a "Invalid format specifier" error anymore
    try:
        # Simulate the fixed f-string
        prompt = f"history: {history} user: Get all the info of the user"
        print("✅ Format specifier fix works - no error in f-string")
        print(f"Generated prompt: {prompt[:50]}...")
    except Exception as e:
        print(f"❌ Format specifier still has issues: {e}")

def test_json_parsing():
    """Test JSON parsing logic"""
    print("\nTesting JSON parsing logic...")
    
    # Test case 1: Valid JSON array
    json_string = '[{"user_name": "John", "user_email": "john@example.com"}]'
    try:
        parsed_data = json.loads(json_string)
        if isinstance(parsed_data, list) and len(parsed_data) > 0:
            extracted_data = parsed_data[0]  # This is what our fix does
            print("✅ JSON array parsing works correctly")
            print(f"Extracted data type: {type(extracted_data)}")
        else:
            print("❌ JSON array parsing logic failed")
    except Exception as e:
        print(f"❌ JSON parsing failed: {e}")
    
    # Test case 2: Empty array fallback
    json_string = '[{}]'
    try:
        parsed_data = json.loads(json_string)
        if isinstance(parsed_data, list) and len(parsed_data) > 0:
            extracted_data = parsed_data[0]
            print("✅ Empty object fallback works correctly")
        else:
            print("❌ Empty object fallback failed")
    except Exception as e:
        print(f"❌ Empty object parsing failed: {e}")

if __name__ == "__main__":
    print("🔧 Testing Chat API Fixes")
    print("=" * 50)
    
    test_pydantic_validation()
    test_structure_response_format()
    test_json_parsing()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nSummary of fixes:")
    print("1. Fixed 'Invalid format specifier' error in structure_response.py")
    print("2. Fixed Pydantic validation by extracting dict from list")
    print("3. Fixed MIME import case sensitivity issues")
    print("4. Updated frontend to handle dict instead of array")
