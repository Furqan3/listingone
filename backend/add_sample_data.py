#!/usr/bin/env python3
"""
Script to add sample data to the ListingOne.ai backend for testing
"""

import requests
import json
import time
import random
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000/api"

# Sample user data for testing
SAMPLE_USERS = [
    {
        "name": "John Smith",
        "email": "john.smith@email.com",
        "phone": "+1-555-0101",
        "type": "buying",
        "property": "123 Main St, Anytown, CA"
    },
    {
        "name": "Sarah Johnson",
        "email": "sarah.j@email.com", 
        "phone": "+1-555-0102",
        "type": "selling",
        "property": "456 Oak Ave, Somewhere, NY"
    },
    {
        "name": "Mike Davis",
        "email": "mike.davis@email.com",
        "phone": "+1-555-0103", 
        "type": "buying",
        "property": "789 Pine St, Elsewhere, TX"
    },
    {
        "name": "Lisa Wilson",
        "email": "lisa.wilson@email.com",
        "phone": "+1-555-0104",
        "type": "selling", 
        "property": "321 Elm Dr, Nowhere, FL"
    },
    {
        "name": "David Brown",
        "email": "david.brown@email.com",
        "phone": "+1-555-0105",
        "type": "buying",
        "property": "654 Maple Ln, Anywhere, WA"
    }
]

SAMPLE_MESSAGES = [
    "Hi, I'm interested in buying a home",
    "Hello, I need help selling my property", 
    "I'm looking for a real estate agent",
    "Can you help me with property valuation?",
    "I want to know about the current market",
    "What's the process for buying a house?",
    "How long does it take to sell a property?",
    "I'm a first-time home buyer",
    "I need to sell my house quickly",
    "What are the current interest rates?"
]

def create_sample_conversation(user_data, messages_count=None):
    """Create a sample conversation with realistic data"""
    
    if messages_count is None:
        messages_count = random.randint(3, 8)
    
    session_id = None
    
    # Start conversation
    initial_message = random.choice(SAMPLE_MESSAGES)
    response = requests.post(f"{API_BASE}/chat", json={
        "message": initial_message
    })
    
    if response.status_code == 200:
        data = response.json()
        session_id = data["session_id"]
        print(f"Started conversation {session_id}")
    else:
        print(f"Failed to start conversation: {response.status_code}")
        return None
    
    # Add more messages to build up the conversation
    for i in range(messages_count - 1):
        time.sleep(0.5)  # Small delay between messages
        
        if i == 1:  # Provide name
            message = f"My name is {user_data['name']}"
        elif i == 2:  # Provide email
            message = f"My email is {user_data['email']}"
        elif i == 3:  # Provide phone
            message = f"My phone number is {user_data['phone']}"
        elif i == 4:  # Provide buying/selling info
            message = f"I'm interested in {user_data['type']} a property"
        elif i == 5:  # Provide property address
            message = f"The property address is {user_data['property']}"
        else:
            message = random.choice([
                "Yes, that sounds good",
                "Can you tell me more?",
                "What are the next steps?",
                "I'm very interested",
                "That works for me",
                "Perfect, let's proceed"
            ])
        
        response = requests.post(f"{API_BASE}/chat", json={
            "message": message,
            "session_id": session_id
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Added message {i+1}: {message[:30]}...")
        else:
            print(f"  Failed to add message {i+1}: {response.status_code}")
    
    return session_id

def main():
    print("Adding sample data to ListingOne.ai backend...")
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code != 200:
            print("Backend is not responding properly")
            return
    except requests.exceptions.ConnectionError:
        print("Cannot connect to backend. Make sure it's running on localhost:8000")
        return
    
    print("Backend is running, adding sample conversations...")
    
    # Create sample conversations
    for i, user_data in enumerate(SAMPLE_USERS):
        print(f"\nCreating conversation {i+1}/5 for {user_data['name']}...")
        session_id = create_sample_conversation(user_data)
        
        if session_id:
            print(f"  ✅ Created conversation {session_id}")
        else:
            print(f"  ❌ Failed to create conversation for {user_data['name']}")
        
        time.sleep(1)  # Delay between conversations
    
    print("\n✅ Sample data creation complete!")
    print("You can now check the admin dashboard to see the sample leads and analytics.")

if __name__ == "__main__":
    main()
