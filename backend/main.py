#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional
import uuid
import json
import os
import logging
from datetime import datetime
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from dotenv import load_dotenv

# Import your existing AI helpers
from ai_helpers.chat_response import chat_response
from ai_helpers.structure_response import structure_response

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('listingone.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AIREA - AI Real Estate Assistant API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
conversations: Dict[str, Dict] = {}
user_data_store: Dict[str, Dict] = {}

# Conversation state management
class ConversationState:
    GREETING = "greeting"
    COLLECTING_NAME = "collecting_name"
    COLLECTING_EMAIL = "collecting_email"
    COLLECTING_PHONE = "collecting_phone"
    DETERMINING_TYPE = "determining_type"
    COLLECTING_PROPERTY_INFO = "collecting_property_info"
    SCHEDULING = "scheduling"
    COMPLETE = "complete"

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        min_anystr_length = 1
        max_anystr_length = 1000

class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_data: Optional[Dict] = None
    conversation_complete: bool = False

class UserData(BaseModel):
    user_name: Optional[str] = None
    user_phone_number: Optional[str] = None
    user_email: Optional[EmailStr] = None
    user_contact_preference: Optional[str] = None
    user_buying_or_selling: Optional[str] = None
    user_property_address: Optional[str] = None
    user_property_type: Optional[str] = None
    user_year_built: Optional[str] = None
    user_square_footage: Optional[str] = None
    user_number_of_bedrooms: Optional[str] = None
    user_number_of_bathrooms: Optional[str] = None
    user_lot_size: Optional[str] = None
    user_recent_renovations_or_upgrades: Optional[str] = None
    user_current_condition_assessment: Optional[str] = None

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: str
    message: str
    lead_type: str  # 'buyer' or 'seller'

    class Config:
        str_strip_whitespace = True
        min_anystr_length = 1

# Email service
class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email = os.getenv("EMAIL_ADDRESS")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.to_email = os.getenv("NOTIFICATION_EMAIL", "team@airea.ai")

    def send_welcome_email(self, user_email: str, user_name: str, lead_type: str):
        """Send welcome email to new lead with enhanced template"""
        try:
            if not self.email or not self.password:
                logger.warning("Email credentials not configured, skipping welcome email")
                return False

            msg = MimeMultipart('alternative')
            msg['From'] = self.email
            msg['To'] = user_email
            msg['Subject'] = f"Welcome to AIREA - Your {lead_type.title()} Journey Starts Here! 🏠"

            # Create both plain text and HTML versions
            text_body = f"""
Dear {user_name},

Welcome to AIREA! 🎉

Thank you for choosing your AI Real Estate Assistant. We're thrilled to help you with your {lead_type} journey.

WHAT MAKES US DIFFERENT:
✓ AI-powered property insights
✓ Instant market analysis
✓ Streamlined transaction management
✓ 24/7 intelligent assistance

WHAT'S NEXT:
• Expert agent contact within 24 hours
• Personalized market analysis
• Access to exclusive property insights
• Custom {lead_type} strategy session

Questions? Simply reply to this email or visit our website.

Best regards,
The AIREA Team

---
AIREA - Your AI Real Estate Assistant
This is an automated message. Please do not reply directly to this email.
            """

            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Welcome to AIREA! 🏠</h2>

                  <p>Dear {user_name},</p>

                  <p>Thank you for choosing our AI-powered real estate platform. We're thrilled to help you with your <strong>{lead_type}</strong> journey.</p>

                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1e40af; margin-top: 0;">What Makes Us Different:</h3>
                    <ul style="margin: 0;">
                      <li>✓ AI-powered property insights</li>
                      <li>✓ Instant market analysis</li>
                      <li>✓ Streamlined transaction management</li>
                      <li>✓ 24/7 intelligent assistance</li>
                    </ul>
                  </div>

                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #059669; margin-top: 0;">What's Next:</h3>
                    <ul style="margin: 0;">
                      <li>• Expert agent contact within 24 hours</li>
                      <li>• Personalized market analysis</li>
                      <li>• Access to exclusive property insights</li>
                      <li>• Custom {lead_type} strategy session</li>
                    </ul>
                  </div>

                  <p>Questions? Simply reply to this email or visit our website.</p>

                  <p>Best regards,<br>
                  <strong>The AIREA Team</strong></p>

                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="font-size: 12px; color: #6b7280;">
                    AIREA - Your AI Real Estate Assistant<br>
                    This is an automated message. Please do not reply directly to this email.
                  </p>
                </div>
              </body>
            </html>
            """

            # Attach both versions
            msg.attach(MimeText(text_body, 'plain'))
            msg.attach(MimeText(html_body, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)
            text = msg.as_string()
            server.sendmail(self.email, user_email, text)
            server.quit()

            logger.info(f"Welcome email sent successfully to {user_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending welcome email to {user_email}: {e}")
            return False

    def send_notification_email(self, user_data: Dict):
        """Send notification to team about new lead"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.email
            msg['To'] = self.to_email
            msg['Subject'] = f"New {user_data.get('user_buying_or_selling', 'Unknown')} Lead - {user_data.get('user_name', 'Unknown')}"

            body = f"""
            New Lead Alert!

            Lead Information:
            • Name: {user_data.get('user_name', 'Not provided')}
            • Email: {user_data.get('user_email', 'Not provided')}
            • Phone: {user_data.get('user_phone_number', 'Not provided')}
            • Type: {user_data.get('user_buying_or_selling', 'Not specified')}
            • Property Address: {user_data.get('user_property_address', 'Not provided')}
            • Contact Preference: {user_data.get('user_contact_preference', 'Not specified')}

            Property Details:
            • Property Type: {user_data.get('user_property_type', 'Not provided')}
            • Bedrooms: {user_data.get('user_number_of_bedrooms', 'Not provided')}
            • Bathrooms: {user_data.get('user_number_of_bathrooms', 'Not provided')}
            • Square Footage: {user_data.get('user_square_footage', 'Not provided')}
            • Year Built: {user_data.get('user_year_built', 'Not provided')}

            Please follow up within 24 hours!

            ---
            ListingOne.ai Lead Management System
            """

            msg.attach(MimeText(body, 'plain'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)
            text = msg.as_string()
            server.sendmail(self.email, self.to_email, text)
            server.quit()
            return True
        except Exception as e:
            print(f"Error sending notification email: {e}")
            return False

email_service = EmailService()

# API Endpoints
@app.get("/")
async def root():
    return {"message": "ListingOne.ai API is running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage, background_tasks: BackgroundTasks):
    """Main chat endpoint"""
    try:
        logger.info(f"Chat request received: session_id={chat_message.session_id}, message_length={len(chat_message.message)}")

        # Generate or use existing session ID
        session_id = chat_message.session_id or str(uuid.uuid4())

        # Initialize conversation if new session
        if session_id not in conversations:
            conversations[session_id] = {
                "history": {},
                "created_at": datetime.now().isoformat(),
                "user_data": {},
                "conversation_complete": False,
                "state": ConversationState.GREETING,
                "collected_info": {
                    "name": None,
                    "email": None,
                    "phone": None,
                    "lead_type": None
                }
            }
            logger.info(f"New conversation started: {session_id}")

        conversation = conversations[session_id]

        # Get AI response using your existing function
        ai_response = chat_response(conversation["history"], chat_message.message)
        logger.info(f"AI response generated for session {session_id}")
        
        # Check if we should extract user data
        extracted_data = None
        conversation_complete = False
        
        if len(conversation["history"]) > 6:  # After some conversation
            try:
                structured_data = structure_response(conversation["history"])
                if structured_data:
                    extracted_data = json.loads(structured_data)
                    conversation["user_data"] = extracted_data
                    
                    # Check if conversation is complete (has essential data)
                    if extracted_data and len(extracted_data) > 0:
                        first_user = extracted_data[0]
                        if (first_user.get("user_name") and 
                            first_user.get("user_email") and 
                            first_user.get("user_phone_number") and
                            first_user.get("user_buying_or_selling")):
                            
                            conversation_complete = True
                            conversation["conversation_complete"] = True
                            
                            # Send emails in background
                            background_tasks.add_task(
                                email_service.send_welcome_email,
                                first_user.get("user_email"),
                                first_user.get("user_name"),
                                first_user.get("user_buying_or_selling")
                            )
                            background_tasks.add_task(
                                email_service.send_notification_email,
                                first_user
                            )
            except Exception as e:
                logger.error(f"Error extracting user data for session {session_id}: {e}")

        # Store the conversation
        conversations[session_id] = conversation

        logger.info(f"Chat response completed for session {session_id}")
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            user_data=extracted_data,
            conversation_complete=conversation_complete
        )

    except Exception as e:
        logger.error(f"Chat error for session {chat_message.session_id}: {e}")
        raise HTTPException(status_code=500, detail="Chat processing failed. Please try again.")

@app.post("/api/contact")
async def contact_form(contact_data: ContactForm, background_tasks: BackgroundTasks):
    """Handle contact form submissions"""
    try:
        # Store contact data
        contact_id = str(uuid.uuid4())
        user_data_store[contact_id] = {
            "id": contact_id,
            "name": contact_data.name,
            "email": contact_data.email,
            "phone": contact_data.phone,
            "message": contact_data.message,
            "lead_type": contact_data.lead_type,
            "created_at": datetime.now().isoformat(),
            "source": "contact_form"
        }
        
        # Send notification email in background
        user_data_for_email = {
            "user_name": contact_data.name,
            "user_email": contact_data.email,
            "user_phone_number": contact_data.phone,
            "user_buying_or_selling": contact_data.lead_type,
            "message": contact_data.message
        }
        
        background_tasks.add_task(
            email_service.send_welcome_email,
            contact_data.email,
            contact_data.name,
            contact_data.lead_type
        )
        background_tasks.add_task(
            email_service.send_notification_email,
            user_data_for_email
        )
        
        return {"success": True, "message": "Contact form submitted successfully", "id": contact_id}
        
    except Exception as e:
        print(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail=f"Contact form processing failed: {str(e)}")

@app.get("/api/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Get conversation history"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversations[session_id]

@app.get("/api/user-data/{session_id}")
async def get_user_data(session_id: str):
    """Get extracted user data for a session"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversations[session_id]
    return {"user_data": conversation.get("user_data", {})}

@app.delete("/api/conversation/{session_id}")
async def reset_conversation(session_id: str):
    """Reset/delete conversation"""
    if session_id in conversations:
        del conversations[session_id]
    return {"success": True, "message": "Conversation reset"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_conversations": len(conversations)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)