#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional
import uuid
import json
import os
import logging
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
try:
    import jwt
except ImportError:
    # Fallback for testing
    class MockJWT:
        @staticmethod
        def encode(payload, key, algorithm):
            # Mock JWT encoding for testing - key and algorithm are ignored
            import base64
            import json
            return base64.b64encode(json.dumps(payload).encode()).decode()

        @staticmethod
        def decode(token, key, algorithms):
            # Mock JWT decoding for testing - key and algorithms are ignored
            import base64
            import json
            return json.loads(base64.b64decode(token.encode()).decode())

    jwt = MockJWT()
import hashlib
import secrets

# Import your existing AI helpers
from ai_helpers.chat_response import chat_response
from ai_helpers.structure_response import (
    structure_response, validate_user_data, detect_duplicate_lead,
    detect_spam_patterns, calculate_lead_score, analyze_conversation_sentiment,
    detect_conversation_intent, identify_conversation_topics
)

# Load environment variables
load_dotenv()

# Environment validation
def validate_environment():
    """Validate required environment variables and configuration"""
    validation_results = {
        "valid": True,
        "errors": [],
        "warnings": []
    }

    # Required environment variables
    required_vars = {
        "GEMINI_API_KEY": "Google Gemini API key for AI responses",
        "EMAIL_ADDRESS": "SMTP email address for sending notifications",
        "EMAIL_PASSWORD": "SMTP email password/app password"
    }

    # Optional environment variables with defaults
    optional_vars = {
        "GEMINI_MODEL": "gemini-pro",
        "SYSTEM_PROMPT_PATH": "stem_prompt.txt",
        "SMTP_SERVER": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "NOTIFICATION_EMAIL": "team@airea.ai"
    }

    # Check required variables
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            validation_results["errors"].append(f"Missing required environment variable: {var} ({description})")
            validation_results["valid"] = False
        elif var == "GEMINI_API_KEY" and len(value) < 10:
            validation_results["warnings"].append(f"GEMINI_API_KEY seems too short, please verify")
        elif var == "EMAIL_ADDRESS" and "@" not in value:
            validation_results["errors"].append(f"EMAIL_ADDRESS appears to be invalid: {value}")
            validation_results["valid"] = False

    # Check optional variables and set defaults
    for var, default in optional_vars.items():
        value = os.getenv(var)
        if not value:
            validation_results["warnings"].append(f"Using default for {var}: {default}")

    # Validate system prompt file exists
    system_prompt_path = os.getenv("SYSTEM_PROMPT_PATH", "stem_prompt.txt")
    if not os.path.exists(system_prompt_path):
        validation_results["warnings"].append(f"System prompt file not found: {system_prompt_path}, will use fallback")

    return validation_results

# Validate environment on startup
env_validation = validate_environment()
if not env_validation["valid"]:
    print("❌ Environment validation failed:")
    for error in env_validation["errors"]:
        print(f"  - {error}")
    print("\nPlease check your .env file and ensure all required variables are set.")
    exit(1)

if env_validation["warnings"]:
    print("⚠️  Environment warnings:")
    for warning in env_validation["warnings"]:
        print(f"  - {warning}")

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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "file://"  # Allow local file access for admin panel
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
conversations: Dict[str, Dict] = {}
user_data_store: Dict[str, Dict] = {}
admin_users: Dict[str, Dict] = {}
admin_sessions: Dict[str, Dict] = {}

# Initialize default admin user
def initialize_admin_users():
    """Initialize default admin users"""
    default_admin = {
        "id": "admin-001",
        "username": "admin",
        "email": "admin@listingone.ai",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "super_admin",
        "permissions": ["all"],
        "created_at": datetime.now().isoformat(),
        "last_login": None,
        "active": True
    }
    admin_users["admin"] = default_admin
    logger.info("Default admin user initialized (username: admin, password: admin123)")

# Initialize admin users on startup
initialize_admin_users()

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Authentication utilities
security = HTTPBearer()

def create_access_token(user_data: dict) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {
        "sub": user_data["username"],
        "user_id": user_data["id"],
        "role": user_data["role"],
        "permissions": user_data["permissions"],
        "exp": expire
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user still exists and is active
        if username not in admin_users or not admin_users[username]["active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def check_permission(user_data: dict, required_permission: str) -> bool:
    """Check if user has required permission"""
    if user_data["role"] == "super_admin" or "all" in user_data["permissions"]:
        return True
    return required_permission in user_data["permissions"]

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
    progress: Optional[Dict] = None
    conversation_state: Optional[str] = None
    next_action: Optional[str] = None
    duplicate_warning: Optional[bool] = None
    spam_warning: Optional[bool] = None
    lead_score: Optional[Dict] = None

# Admin Authentication Models
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: Dict
    expires_in: int

class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "agent"
    permissions: list = []

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    permissions: list
    created_at: str
    last_login: Optional[str]
    active: bool

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
        try:
            self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        except ValueError:
            logger.warning("Invalid SMTP_PORT, using default 587")
            self.smtp_port = 587

        self.email = os.getenv("EMAIL_ADDRESS")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.to_email = os.getenv("NOTIFICATION_EMAIL", "team@airea.ai")

        # Validate email configuration
        self.email_configured = bool(self.email and self.password)
        if not self.email_configured:
            logger.warning("Email service not properly configured - emails will be skipped")

    def send_welcome_email(self, user_email: str, user_name: str, lead_type: str):
        """Send welcome email to new lead with enhanced template"""
        try:
            if not self.email_configured:
                logger.warning("Email credentials not configured, skipping welcome email")
                return False

            # Validate input parameters
            if not user_email or not user_name or not lead_type:
                logger.error(f"Invalid email parameters: email={user_email}, name={user_name}, type={lead_type}")
                return False

            # Basic email validation
            if "@" not in user_email or "." not in user_email.split("@")[1]:
                logger.error(f"Invalid email address format: {user_email}")
                return False

            msg = MIMEMultipart('alternative')
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
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            # Send email with proper error handling
            server = None
            try:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.email, self.password)
                text = msg.as_string()
                server.sendmail(self.email, user_email, text)
                logger.info(f"Welcome email sent successfully to {user_email}")
                return True
            except smtplib.SMTPAuthenticationError:
                logger.error(f"SMTP authentication failed - check email credentials")
                return False
            except smtplib.SMTPRecipientsRefused:
                logger.error(f"Recipient email rejected: {user_email}")
                return False
            except smtplib.SMTPException as e:
                logger.error(f"SMTP error sending welcome email: {e}")
                return False
            finally:
                if server:
                    try:
                        server.quit()
                    except:
                        pass

        except Exception as e:
            logger.error(f"Unexpected error sending welcome email to {user_email}: {e}")
            return False

    def send_notification_email(self, user_data: Dict):
        """Send notification to team about new lead"""
        try:
            if not self.email_configured:
                logger.warning("Email credentials not configured, skipping notification email")
                return False

            if not user_data:
                logger.error("No user data provided for notification email")
                return False

            msg = MIMEMultipart()
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

            msg.attach(MIMEText(body, 'plain'))

            # Send email with proper error handling
            server = None
            try:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.email, self.password)
                text = msg.as_string()
                server.sendmail(self.email, self.to_email, text)
                logger.info(f"Notification email sent successfully for lead: {user_data.get('user_name', 'Unknown')}")
                return True
            except smtplib.SMTPAuthenticationError:
                logger.error("SMTP authentication failed for notification email")
                return False
            except smtplib.SMTPException as e:
                logger.error(f"SMTP error sending notification email: {e}")
                return False
            finally:
                if server:
                    try:
                        server.quit()
                    except:
                        pass

        except Exception as e:
            logger.error(f"Unexpected error sending notification email: {e}")
            return False

email_service = EmailService()

# Conversation management functions
def update_conversation_progress(conversation, extracted_data):
    """Update conversation progress based on collected data"""
    if not extracted_data:
        return

    progress = conversation["progress"]
    completed_fields = []

    # Check which fields have been collected
    required_fields = {
        "user_name": "Name",
        "user_email": "Email",
        "user_phone_number": "Phone",
        "user_buying_or_selling": "Lead Type"
    }

    for field, label in required_fields.items():
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

    # Update conversation state based on progress
    if progress["completion_rate"] >= 100:
        conversation["state"] = ConversationState.COMPLETE
        progress["current_step"] = progress["total_steps"]
    elif "user_buying_or_selling" in progress["completed_fields"]:
        conversation["state"] = ConversationState.COLLECTING_PROPERTY_INFO
        progress["current_step"] = 5
    elif "user_phone_number" in progress["completed_fields"]:
        conversation["state"] = ConversationState.DETERMINING_TYPE
        progress["current_step"] = 4
    elif "user_email" in progress["completed_fields"]:
        conversation["state"] = ConversationState.COLLECTING_PHONE
        progress["current_step"] = 3
    elif "user_name" in progress["completed_fields"]:
        conversation["state"] = ConversationState.COLLECTING_EMAIL
        progress["current_step"] = 2

    # Calculate engagement score based on conversation length and quality
    conversation_length = len(conversation["history"])
    if conversation_length > 0:
        engagement_score = min(100, (conversation_length / 10) * 100)
        conversation["conversation_quality"]["engagement_score"] = engagement_score

def get_conversation_context(conversation):
    """Generate context string for AI with progress information"""
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
            logger.info(f"New conversation started: {session_id}")

        conversation = conversations[session_id]

        # Add conversation context for better AI responses
        conversation_context = get_conversation_context(conversation)

        # Get AI response using your existing function with context
        ai_response = chat_response(conversation["history"], chat_message.message, conversation_context)
        logger.info(f"AI response generated for session {session_id}")
        
        # Check if we should extract user data
        extracted_data = None
        conversation_complete = False
        
        if len(conversation["history"]) > 6:  # After some conversation
            try:
                structured_data = structure_response(conversation["history"])
                if structured_data:
                    parsed_data = json.loads(structured_data)
                    # structure_response returns a list, but we need the first item as a dict
                    if parsed_data and len(parsed_data) > 0:
                        extracted_data = parsed_data[0]  # Get the first (and only) user object
                        conversation["user_data"] = extracted_data

                        # Update conversation progress
                        update_conversation_progress(conversation, extracted_data)

                        # Validate the data quality
                        validation_results = validate_user_data(extracted_data)
                        logger.info(f"Data validation for session {session_id}: {validation_results}")

                        # Check for duplicates and spam
                        duplicate_check = detect_duplicate_lead(extracted_data, conversations)
                        spam_check = detect_spam_patterns(extracted_data)

                        # Calculate lead score
                        lead_score = calculate_lead_score(extracted_data, conversation)

                        # Analyze conversation intelligence
                        sentiment_analysis = analyze_conversation_sentiment(conversation["history"])
                        intent_analysis = detect_conversation_intent(conversation["history"], extracted_data)
                        topic_analysis = identify_conversation_topics(conversation["history"])

                        # Log potential issues and lead quality
                        if duplicate_check["is_duplicate"]:
                            logger.warning(f"Potential duplicate lead detected for session {session_id}: {duplicate_check}")
                        if spam_check["is_spam"]:
                            logger.warning(f"Potential spam detected for session {session_id}: {spam_check}")

                        logger.info(f"Lead score for session {session_id}: {lead_score['total_score']} ({lead_score['category']})")
                        logger.info(f"Conversation sentiment: {sentiment_analysis['sentiment']} (engagement: {sentiment_analysis['engagement']})")
                        logger.info(f"Primary intent: {intent_analysis['primary_intent']}")

                        # Update conversation quality metrics
                        conversation["conversation_quality"]["data_quality_score"] = validation_results["quality_score"]
                        conversation["duplicate_check"] = duplicate_check
                        conversation["spam_check"] = spam_check
                        conversation["lead_score"] = lead_score
                        conversation["conversation_intelligence"] = {
                            "sentiment": sentiment_analysis,
                            "intent": intent_analysis,
                            "topics": topic_analysis
                        }

                        # Check if conversation is complete based on validation and progress
                        progress_complete = conversation["progress"]["completion_rate"] >= 100
                        validation_passed = validation_results["is_valid"] and validation_results["completeness_score"] >= 75

                        if progress_complete and validation_passed:
                            conversation_complete = True
                            conversation["conversation_complete"] = True
                            conversation["validation_results"] = validation_results

                            # Send emails in background
                            background_tasks.add_task(
                                email_service.send_welcome_email,
                                extracted_data.get("user_email"),
                                extracted_data.get("user_name"),
                                extracted_data.get("user_buying_or_selling")
                            )
                            background_tasks.add_task(
                                email_service.send_notification_email,
                                extracted_data
                            )
                    else:
                        # If no valid data, set extracted_data to None
                        extracted_data = None
            except Exception as e:
                logger.error(f"Error extracting user data for session {session_id}: {e}")
                extracted_data = None

        # Store the conversation
        conversations[session_id] = conversation

        # Get warning flags and lead score
        duplicate_warning = conversation.get("duplicate_check", {}).get("is_duplicate", False)
        spam_warning = conversation.get("spam_check", {}).get("is_spam", False)
        lead_score_data = conversation.get("lead_score")

        logger.info(f"Chat response completed for session {session_id}")
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            user_data=extracted_data,
            conversation_complete=conversation_complete,
            progress=conversation["progress"],
            conversation_state=conversation["state"],
            next_action=_get_next_action_suggestion(conversation),
            duplicate_warning=duplicate_warning,
            spam_warning=spam_warning,
            lead_score=lead_score_data
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
    """Get conversation history with progress information"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation = conversations[session_id]

    # Add computed fields for better frontend integration
    response_data = {
        **conversation,
        "progress_percentage": conversation["progress"]["completion_rate"],
        "current_step_name": conversation["state"],
        "next_action": _get_next_action_suggestion(conversation)
    }

    return response_data

def _get_next_action_suggestion(conversation):
    """Get suggestion for next action based on conversation state"""
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

@app.get("/api/conversation/{session_id}/progress")
async def get_conversation_progress(session_id: str):
    """Get detailed conversation progress"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation = conversations[session_id]
    return {
        "session_id": session_id,
        "progress": conversation["progress"],
        "state": conversation["state"],
        "quality_metrics": conversation["conversation_quality"],
        "completion_status": conversation.get("conversation_complete", False),
        "next_action": _get_next_action_suggestion(conversation)
    }

@app.get("/api/user-data/{session_id}")
async def get_user_data(session_id: str):
    """Get extracted user data for a session"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversations[session_id]
    return {"user_data": conversation.get("user_data", {})}

@app.delete("/api/conversation/{session_id}")
async def reset_conversation(session_id: str):
    """Reset/delete conversation with backup"""
    if session_id in conversations:
        # Backup conversation before deletion for analytics
        backup_data = {
            "session_id": session_id,
            "deleted_at": datetime.now().isoformat(),
            "conversation_data": conversations[session_id]
        }
        logger.info(f"Conversation {session_id} deleted. Backup: {backup_data}")
        del conversations[session_id]
        return {"success": True, "message": "Conversation reset", "backup_id": session_id}
    else:
        raise HTTPException(status_code=404, detail="Conversation not found")

@app.post("/api/conversation/{session_id}/restart")
async def restart_conversation(session_id: str):
    """Restart conversation while preserving some data"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")

    old_conversation = conversations[session_id]

    # Preserve user data if it exists
    preserved_user_data = old_conversation.get("user_data", {})

    # Create new conversation with preserved data
    conversations[session_id] = {
        "history": {},
        "created_at": datetime.now().isoformat(),
        "user_data": preserved_user_data,
        "conversation_complete": False,
        "state": ConversationState.GREETING,
        "progress": {
            "current_step": 1,
            "total_steps": 6,
            "completed_fields": [],
            "next_required_field": "user_name",
            "completion_rate": 0
        },
        "collected_info": {
            "name": preserved_user_data.get("user_name"),
            "email": preserved_user_data.get("user_email"),
            "phone": preserved_user_data.get("user_phone_number"),
            "lead_type": preserved_user_data.get("user_buying_or_selling")
        },
        "conversation_quality": {
            "engagement_score": 0,
            "completion_rate": 0,
            "data_quality_score": 0
        },
        "restarted_from": old_conversation.get("created_at"),
        "restart_count": old_conversation.get("restart_count", 0) + 1
    }

    # Update progress if we have preserved data
    if preserved_user_data:
        update_conversation_progress(conversations[session_id], preserved_user_data)

    return {
        "success": True,
        "message": "Conversation restarted",
        "preserved_data": bool(preserved_user_data),
        "restart_count": conversations[session_id]["restart_count"]
    }

@app.get("/api/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_conversations": len(conversations),
        "components": {}
    }

    # Check environment variables
    env_check = validate_environment()
    health_status["components"]["environment"] = {
        "status": "healthy" if env_check["valid"] else "unhealthy",
        "errors": env_check["errors"],
        "warnings": env_check["warnings"]
    }

    # Check email service
    health_status["components"]["email_service"] = {
        "status": "healthy" if email_service.email_configured else "degraded",
        "configured": email_service.email_configured
    }

    # Check AI service (basic validation)
    ai_status = "healthy"
    ai_errors = []

    if not os.getenv("GEMINI_API_KEY"):
        ai_status = "unhealthy"
        ai_errors.append("GEMINI_API_KEY not configured")

    # Check system prompt file
    system_prompt_path = os.getenv("SYSTEM_PROMPT_PATH", "stem_prompt.txt")
    if not os.path.exists(system_prompt_path):
        ai_status = "degraded" if ai_status == "healthy" else ai_status
        ai_errors.append(f"System prompt file not found: {system_prompt_path}")

    health_status["components"]["ai_service"] = {
        "status": ai_status,
        "errors": ai_errors
    }

    # Overall status
    component_statuses = [comp["status"] for comp in health_status["components"].values()]
    if "unhealthy" in component_statuses:
        health_status["status"] = "unhealthy"
    elif "degraded" in component_statuses:
        health_status["status"] = "degraded"

    return health_status

# Admin Authentication Endpoints
@app.post("/api/admin/login", response_model=AdminLoginResponse)
async def admin_login(login_data: AdminLoginRequest):
    """Admin login endpoint"""
    username = login_data.username
    password = login_data.password

    # Check if user exists
    if username not in admin_users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    user = admin_users[username]

    # Check if user is active
    if not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Update last login
    user["last_login"] = datetime.now().isoformat()

    # Create access token
    access_token = create_access_token(user)

    # Store session
    session_id = str(uuid.uuid4())
    admin_sessions[session_id] = {
        "user_id": user["id"],
        "username": username,
        "created_at": datetime.now().isoformat(),
        "last_activity": datetime.now().isoformat()
    }

    logger.info(f"Admin login successful: {username}")

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_info={
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "permissions": user["permissions"]
        },
        expires_in=JWT_EXPIRATION_HOURS * 3600
    )

@app.post("/api/admin/logout")
async def admin_logout(current_user: dict = Depends(verify_token)):
    """Admin logout endpoint"""
    # Remove all sessions for this user
    sessions_to_remove = [
        session_id for session_id, session in admin_sessions.items()
        if session["username"] == current_user["sub"]
    ]

    for session_id in sessions_to_remove:
        del admin_sessions[session_id]

    logger.info(f"Admin logout: {current_user['sub']}")

    return {"message": "Logged out successfully"}

@app.get("/api/admin/me", response_model=AdminUserResponse)
async def get_current_admin_user(current_user: dict = Depends(verify_token)):
    """Get current admin user info"""
    username = current_user["sub"]
    user = admin_users[username]

    return AdminUserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        permissions=user["permissions"],
        created_at=user["created_at"],
        last_login=user["last_login"],
        active=user["active"]
    )

@app.post("/api/admin/users", response_model=AdminUserResponse)
async def create_admin_user(
    user_data: AdminUserCreate,
    current_user: dict = Depends(verify_token)
):
    """Create new admin user (super_admin only)"""
    if not check_permission(current_user, "user_management"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Check if username already exists
    if user_data.username in admin_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Create new user
    new_user = {
        "id": f"admin-{len(admin_users) + 1:03d}",
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "permissions": user_data.permissions,
        "created_at": datetime.now().isoformat(),
        "last_login": None,
        "active": True
    }

    admin_users[user_data.username] = new_user

    logger.info(f"New admin user created: {user_data.username} by {current_user['sub']}")

    return AdminUserResponse(
        id=new_user["id"],
        username=new_user["username"],
        email=new_user["email"],
        role=new_user["role"],
        permissions=new_user["permissions"],
        created_at=new_user["created_at"],
        last_login=new_user["last_login"],
        active=new_user["active"]
    )

# Admin endpoints
@app.get("/api/admin/conversations")
async def list_all_conversations(current_user: dict = Depends(verify_token)):
    """List all conversations with summary information"""
    if not check_permission(current_user, "view_conversations"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    conversation_summaries = []

    for session_id, conversation in conversations.items():
        summary = {
            "session_id": session_id,
            "created_at": conversation["created_at"],
            "state": conversation["state"],
            "progress": conversation["progress"]["completion_rate"],
            "conversation_complete": conversation.get("conversation_complete", False),
            "message_count": len(conversation["history"]),
            "has_user_data": bool(conversation.get("user_data")),
            "quality_score": conversation["conversation_quality"]["data_quality_score"],
            "restart_count": conversation.get("restart_count", 0)
        }

        # Add user info if available
        if conversation.get("user_data"):
            user_data = conversation["user_data"]
            summary["user_info"] = {
                "name": user_data.get("user_name", ""),
                "email": user_data.get("user_email", ""),
                "lead_type": user_data.get("user_buying_or_selling", "")
            }

        conversation_summaries.append(summary)

    # Sort by creation date (newest first)
    conversation_summaries.sort(key=lambda x: x["created_at"], reverse=True)

    return {
        "total_conversations": len(conversation_summaries),
        "active_conversations": len([c for c in conversation_summaries if not c["conversation_complete"]]),
        "completed_conversations": len([c for c in conversation_summaries if c["conversation_complete"]]),
        "conversations": conversation_summaries
    }

@app.get("/api/admin/leads")
async def get_qualified_leads(current_user: dict = Depends(verify_token)):
    """Get all qualified leads from conversations"""
    if not check_permission(current_user, "view_leads"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    qualified_leads = []

    for session_id, conversation in conversations.items():
        if conversation.get("conversation_complete") and conversation.get("user_data"):
            user_data = conversation["user_data"]
            validation_results = conversation.get("validation_results", {})

            lead = {
                "session_id": session_id,
                "created_at": conversation["created_at"],
                "user_data": user_data,
                "quality_score": validation_results.get("quality_score", 0),
                "completeness_score": validation_results.get("completeness_score", 0),
                "conversation_quality": conversation["conversation_quality"],
                "source": "chat_conversation"
            }
            qualified_leads.append(lead)

    # Add contact form leads
    for contact_id, contact_data in user_data_store.items():
        if contact_data.get("source") == "contact_form":
            lead = {
                "contact_id": contact_id,
                "created_at": contact_data["created_at"],
                "user_data": {
                    "user_name": contact_data["name"],
                    "user_email": contact_data["email"],
                    "user_phone_number": contact_data["phone"],
                    "user_buying_or_selling": contact_data["lead_type"],
                    "message": contact_data.get("message", "")
                },
                "quality_score": 100,  # Contact form leads are considered high quality
                "completeness_score": 100,
                "source": "contact_form"
            }
            qualified_leads.append(lead)

    # Sort by creation date (newest first)
    qualified_leads.sort(key=lambda x: x["created_at"], reverse=True)

    return {
        "total_leads": len(qualified_leads),
        "chat_leads": len([l for l in qualified_leads if l["source"] == "chat_conversation"]),
        "contact_form_leads": len([l for l in qualified_leads if l["source"] == "contact_form"]),
        "leads": qualified_leads
    }

@app.get("/api/admin/analytics")
async def get_analytics():
    """Get conversation and lead analytics"""
    total_conversations = len(conversations)
    completed_conversations = len([c for c in conversations.values() if c.get("conversation_complete")])

    # Calculate average completion rate
    if total_conversations > 0:
        avg_completion_rate = sum(c["progress"]["completion_rate"] for c in conversations.values()) / total_conversations
        avg_quality_score = sum(c["conversation_quality"]["data_quality_score"] for c in conversations.values()) / total_conversations
    else:
        avg_completion_rate = 0
        avg_quality_score = 0

    # Conversation states distribution
    state_distribution = {}
    for conversation in conversations.values():
        state = conversation["state"]
        state_distribution[state] = state_distribution.get(state, 0) + 1

    # Lead type distribution
    lead_type_distribution = {"buying": 0, "selling": 0, "unknown": 0}
    for conversation in conversations.values():
        if conversation.get("user_data"):
            lead_type = conversation["user_data"].get("user_buying_or_selling", "").lower()
            if "buy" in lead_type:
                lead_type_distribution["buying"] += 1
            elif "sell" in lead_type:
                lead_type_distribution["selling"] += 1
            else:
                lead_type_distribution["unknown"] += 1

    return {
        "conversation_metrics": {
            "total_conversations": total_conversations,
            "completed_conversations": completed_conversations,
            "completion_rate": (completed_conversations / total_conversations * 100) if total_conversations > 0 else 0,
            "average_progress": avg_completion_rate,
            "average_quality_score": avg_quality_score
        },
        "state_distribution": state_distribution,
        "lead_type_distribution": lead_type_distribution,
        "contact_form_submissions": len(user_data_store),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/admin/leads/hot")
async def get_hot_leads():
    """Get all hot leads (score >= 80) for immediate follow-up"""
    hot_leads = []

    for session_id, conversation in conversations.items():
        lead_score = conversation.get("lead_score", {})
        if lead_score.get("total_score", 0) >= 80:
            user_data = conversation.get("user_data", {})
            hot_leads.append({
                "session_id": session_id,
                "created_at": conversation["created_at"],
                "user_data": user_data,
                "lead_score": lead_score,
                "conversation_quality": conversation["conversation_quality"],
                "last_activity": max(conversation["history"].keys()) if conversation["history"] else conversation["created_at"]
            })

    # Sort by score (highest first)
    hot_leads.sort(key=lambda x: x["lead_score"]["total_score"], reverse=True)

    return {
        "total_hot_leads": len(hot_leads),
        "leads": hot_leads
    }

@app.get("/api/admin/leads/by-score")
async def get_leads_by_score():
    """Get leads grouped by score category"""
    leads_by_category = {
        "Hot": [],
        "Warm": [],
        "Qualified": [],
        "Cold": [],
        "Unqualified": []
    }

    for session_id, conversation in conversations.items():
        if not conversation.get("user_data"):
            continue

        lead_score = conversation.get("lead_score", {})
        category = lead_score.get("category", "Unqualified")

        lead_info = {
            "session_id": session_id,
            "created_at": conversation["created_at"],
            "user_data": conversation["user_data"],
            "lead_score": lead_score,
            "progress": conversation["progress"]["completion_rate"]
        }

        leads_by_category[category].append(lead_info)

    # Sort each category by score
    for category in leads_by_category:
        leads_by_category[category].sort(
            key=lambda x: x["lead_score"].get("total_score", 0),
            reverse=True
        )

    return {
        "categories": leads_by_category,
        "summary": {cat: len(leads) for cat, leads in leads_by_category.items()}
    }

@app.post("/api/admin/leads/{session_id}/assign-agent")
async def assign_agent_to_lead(session_id: str, agent_data: Dict):
    """Assign an agent to a lead"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Lead not found")

    conversation = conversations[session_id]

    # Add agent assignment info
    conversation["agent_assignment"] = {
        "agent_name": agent_data.get("agent_name"),
        "agent_email": agent_data.get("agent_email"),
        "assigned_at": datetime.now().isoformat(),
        "assigned_by": agent_data.get("assigned_by", "admin"),
        "status": "assigned"
    }

    logger.info(f"Agent {agent_data.get('agent_name')} assigned to lead {session_id}")

    return {
        "success": True,
        "message": f"Agent assigned to lead {session_id}",
        "assignment": conversation["agent_assignment"]
    }

@app.put("/api/admin/leads/{session_id}/status")
async def update_lead_status(session_id: str, status_data: Dict):
    """Update lead status"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Lead not found")

    valid_statuses = ["new", "contacted", "qualified", "appointment_set", "converted", "lost"]
    new_status = status_data.get("status")

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    conversation = conversations[session_id]

    # Initialize lead status tracking if not exists
    if "lead_status" not in conversation:
        conversation["lead_status"] = {
            "current_status": "new",
            "status_history": []
        }

    # Update status
    old_status = conversation["lead_status"]["current_status"]
    conversation["lead_status"]["current_status"] = new_status
    conversation["lead_status"]["status_history"].append({
        "from_status": old_status,
        "to_status": new_status,
        "changed_at": datetime.now().isoformat(),
        "changed_by": status_data.get("changed_by", "admin"),
        "notes": status_data.get("notes", "")
    })

    logger.info(f"Lead {session_id} status changed from {old_status} to {new_status}")

    return {
        "success": True,
        "message": f"Lead status updated to {new_status}",
        "lead_status": conversation["lead_status"]
    }

@app.get("/api/admin/leads/{session_id}/full")
async def get_full_lead_details(session_id: str):
    """Get complete lead information including conversation history"""
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Lead not found")

    conversation = conversations[session_id]

    # Format conversation history for better readability
    formatted_history = []
    for message, role in conversation["history"].items():
        formatted_history.append({
            "role": role,
            "message": message,
            "timestamp": "N/A"  # We don't store timestamps for individual messages yet
        })

    return {
        "session_id": session_id,
        "basic_info": {
            "created_at": conversation["created_at"],
            "conversation_complete": conversation.get("conversation_complete", False),
            "state": conversation["state"],
            "restart_count": conversation.get("restart_count", 0)
        },
        "user_data": conversation.get("user_data", {}),
        "progress": conversation["progress"],
        "conversation_quality": conversation["conversation_quality"],
        "lead_score": conversation.get("lead_score", {}),
        "agent_assignment": conversation.get("agent_assignment"),
        "lead_status": conversation.get("lead_status"),
        "duplicate_check": conversation.get("duplicate_check", {}),
        "spam_check": conversation.get("spam_check", {}),
        "conversation_history": formatted_history,
        "validation_results": conversation.get("validation_results", {})
    }

@app.get("/api/admin/analytics/performance")
async def get_performance_analytics(current_user: dict = Depends(verify_token)):
    """Get detailed performance analytics"""
    if not check_permission(current_user, "view_analytics"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Calculate performance metrics
    total_conversations = len(conversations)
    completed_conversations = len([c for c in conversations.values() if c.get("conversation_complete")])

    # Lead score distribution
    score_distribution = {"Hot": 0, "Warm": 0, "Qualified": 0, "Cold": 0, "Unqualified": 0}
    total_score = 0
    scored_leads = 0

    # Conversion funnel
    funnel_data = {
        "visitors": total_conversations,
        "engaged": 0,  # More than 3 messages
        "qualified": 0,  # Has contact info
        "converted": completed_conversations
    }

    for conversation in conversations.values():
        # Score distribution
        lead_score = conversation.get("lead_score", {})
        category = lead_score.get("category", "Unqualified")
        score_distribution[category] += 1

        if lead_score.get("total_score"):
            total_score += lead_score["total_score"]
            scored_leads += 1

        # Engagement analysis
        message_count = len(conversation.get("history", {}))
        if message_count > 3:
            funnel_data["engaged"] += 1

        if conversation.get("user_data", {}).get("user_email"):
            funnel_data["qualified"] += 1

    # Calculate rates
    engagement_rate = (funnel_data["engaged"] / max(1, funnel_data["visitors"])) * 100
    qualification_rate = (funnel_data["qualified"] / max(1, funnel_data["visitors"])) * 100
    conversion_rate = (funnel_data["converted"] / max(1, funnel_data["visitors"])) * 100

    avg_lead_score = total_score / max(1, scored_leads)

    return {
        "overview": {
            "total_conversations": total_conversations,
            "completed_conversations": completed_conversations,
            "conversion_rate": round(conversion_rate, 2),
            "average_lead_score": round(avg_lead_score, 1)
        },
        "score_distribution": score_distribution,
        "conversion_funnel": {
            **funnel_data,
            "engagement_rate": round(engagement_rate, 2),
            "qualification_rate": round(qualification_rate, 2),
            "conversion_rate": round(conversion_rate, 2)
        },
        "generated_at": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)