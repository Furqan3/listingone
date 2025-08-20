"""
MongoDB database configuration and models for ListingOne.ai
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import asyncio

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB connection and operations manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        self.connected = False
        
        # MongoDB configuration
        self.mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.database_name = os.getenv("MONGODB_DATABASE", "listingone_ai")
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.mongo_url)
            self.database = self.client[self.database_name]
            
            # Test the connection
            await self.client.admin.command('ping')
            self.connected = True
            logger.info(f"Connected to MongoDB at {self.mongo_url}")
            
            # Create indexes
            await self.create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.connected = False
            # Fall back to in-memory storage
            logger.warning("Falling back to in-memory storage")
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            self.connected = False
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.connected = False
            logger.info("Disconnected from MongoDB")
    
    async def create_indexes(self):
        """Create database indexes for better performance"""
        if not self.connected:
            return
            
        try:
            # Conversations collection indexes
            await self.database.conversations.create_index("session_id", unique=True)
            await self.database.conversations.create_index("created_at")
            await self.database.conversations.create_index("user_data.user_email")
            await self.database.conversations.create_index("conversation_complete")
            await self.database.conversations.create_index("lead_score.total_score")
            
            # Admin users collection indexes
            await self.database.admin_users.create_index("username", unique=True)
            await self.database.admin_users.create_index("email", unique=True)
            
            # Contact forms collection indexes
            await self.database.contact_forms.create_index("email")
            await self.database.contact_forms.create_index("created_at")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    # Conversation operations
    async def save_conversation(self, session_id: str, conversation_data: Dict) -> bool:
        """Save or update a conversation"""
        if not self.connected:
            return False

        try:
            # Create a clean copy without _id to avoid MongoDB conflicts
            clean_data = {}
            for k, v in conversation_data.items():
                if k != "_id":  # Exclude _id field completely
                    clean_data[k] = v

            clean_data["session_id"] = session_id
            clean_data["updated_at"] = datetime.now().isoformat()

            # Use update_one with upsert instead of replace_one to avoid _id conflicts
            await self.database.conversations.update_one(
                {"session_id": session_id},
                {"$set": clean_data},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving conversation {session_id}: {e}")
            return False
    
    async def get_conversation(self, session_id: str) -> Optional[Dict]:
        """Get a conversation by session ID"""
        if not self.connected:
            return None

        try:
            conversation = await self.database.conversations.find_one({"session_id": session_id})
            if conversation and "_id" in conversation:
                conversation["_id"] = str(conversation["_id"])
            return conversation
        except Exception as e:
            logger.error(f"Error getting conversation {session_id}: {e}")
            return None
    
    async def get_all_conversations(self) -> List[Dict]:
        """Get all conversations"""
        if not self.connected:
            return []
            
        try:
            cursor = self.database.conversations.find({}).sort("created_at", -1)
            conversations = await cursor.to_list(length=None)
            return conversations
        except Exception as e:
            logger.error(f"Error getting all conversations: {e}")
            return []
    
    async def get_qualified_leads(self) -> List[Dict]:
        """Get all qualified leads (conversations with user data) with full conversation history"""
        if not self.connected:
            return []

        try:
            cursor = self.database.conversations.find({
                "user_data": {"$exists": True, "$ne": None},
                "user_data.user_email": {"$exists": True, "$ne": ""}
            }).sort("created_at", -1)

            leads = await cursor.to_list(length=None)

            # Process each lead to add conversation history and actions
            processed_leads = []
            for lead in leads:
                processed_lead = self._process_lead_data(lead)
                processed_leads.append(processed_lead)

            return processed_leads
        except Exception as e:
            logger.error(f"Error getting qualified leads: {e}")
            return []

    def _process_lead_data(self, lead: Dict) -> Dict:
        """Process lead data to include conversation history and recommended actions"""
        # Convert MongoDB ObjectId to string to avoid serialization issues
        if "_id" in lead:
            lead["_id"] = str(lead["_id"])

        # Use detailed history if available, otherwise convert basic history
        conversation_history = []
        if lead.get("detailed_history"):
            conversation_history = lead["detailed_history"]
        elif lead.get("history"):
            for message, role in lead["history"].items():
                conversation_history.append({
                    "message": message,
                    "role": role,
                    "timestamp": lead.get("created_at")
                })

        # Determine recommended actions based on lead data and conversation state
        recommended_actions = self._get_recommended_actions(lead)

        # Calculate conversation metrics
        conversation_metrics = self._calculate_conversation_metrics(lead)

        # Add processed data to lead
        lead["conversation_history"] = conversation_history
        lead["recommended_actions"] = recommended_actions
        lead["conversation_metrics"] = conversation_metrics
        lead["last_activity"] = lead.get("updated_at", lead.get("created_at"))

        return lead

    def _get_recommended_actions(self, lead: Dict) -> List[Dict]:
        """Determine recommended actions for a lead based on their data and conversation state"""
        actions = []
        user_data = lead.get("user_data", {})
        conversation_complete = lead.get("conversation_complete", False)

        # High priority actions
        if conversation_complete and user_data.get("user_email"):
            if user_data.get("user_buying_or_selling") == "buying":
                actions.append({
                    "type": "follow_up_call",
                    "priority": "high",
                    "title": "Schedule Buyer Consultation",
                    "description": f"Call {user_data.get('user_name', 'lead')} to discuss their home buying needs",
                    "due_date": "within_24_hours",
                    "contact_info": {
                        "email": user_data.get("user_email"),
                        "phone": user_data.get("user_phone_number")
                    }
                })

                if user_data.get("user_budget_range"):
                    actions.append({
                        "type": "send_listings",
                        "priority": "medium",
                        "title": "Send Property Listings",
                        "description": f"Send curated listings within budget: {user_data.get('user_budget_range')}",
                        "due_date": "within_48_hours"
                    })

            elif user_data.get("user_buying_or_selling") == "selling":
                actions.append({
                    "type": "property_evaluation",
                    "priority": "high",
                    "title": "Schedule Property Evaluation",
                    "description": f"Schedule CMA and property walkthrough for {user_data.get('user_property_address', 'their property')}",
                    "due_date": "within_24_hours",
                    "contact_info": {
                        "email": user_data.get("user_email"),
                        "phone": user_data.get("user_phone_number")
                    }
                })

        # Medium priority actions
        if not conversation_complete:
            missing_fields = []
            required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
            for field in required_fields:
                if not user_data.get(field, "").strip():
                    missing_fields.append(field.replace("user_", "").replace("_", " ").title())

            if missing_fields:
                actions.append({
                    "type": "complete_profile",
                    "priority": "medium",
                    "title": "Complete Lead Profile",
                    "description": f"Missing information: {', '.join(missing_fields)}",
                    "due_date": "within_72_hours"
                })

        # Timeline-based actions
        timeline = user_data.get("user_timeline", "").lower()
        if "asap" in timeline or "urgent" in timeline:
            actions.append({
                "type": "urgent_follow_up",
                "priority": "urgent",
                "title": "Urgent Follow-up Required",
                "description": "Lead indicated urgent timeline - immediate response needed",
                "due_date": "within_2_hours"
            })

        return actions

    def _calculate_conversation_metrics(self, lead: Dict) -> Dict:
        """Calculate conversation quality metrics"""
        history = lead.get("history", {})
        user_data = lead.get("user_data", {})

        # Count messages
        total_messages = len(history)
        user_messages = len([msg for msg, role in history.items() if role == "user"])
        ai_messages = total_messages - user_messages

        # Calculate data completeness
        required_fields = ["user_name", "user_email", "user_phone_number", "user_buying_or_selling"]
        completed_fields = sum(1 for field in required_fields if user_data.get(field, "").strip())
        completeness_percentage = (completed_fields / len(required_fields)) * 100

        # Engagement score based on message count and completeness
        engagement_score = min(100, (user_messages * 10) + completeness_percentage)

        return {
            "total_messages": total_messages,
            "user_messages": user_messages,
            "ai_messages": ai_messages,
            "completeness_percentage": completeness_percentage,
            "engagement_score": engagement_score,
            "conversation_complete": lead.get("conversation_complete", False)
        }

    async def delete_admin_user(self, username: str) -> bool:
        """Delete an admin user"""
        if not self.connected:
            return False

        try:
            result = await self.database.admin_users.delete_one({"username": username})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting admin user {username}: {e}")
            return False

    async def get_all_admin_users(self) -> List[Dict]:
        """Get all admin users"""
        if not self.connected:
            return []

        try:
            cursor = self.database.admin_users.find({}, {"password_hash": 0})  # Exclude password hash
            users = await cursor.to_list(length=None)

            # Convert ObjectId to string for each user
            for user in users:
                if "_id" in user:
                    user["_id"] = str(user["_id"])

            return users
        except Exception as e:
            logger.error(f"Error getting all admin users: {e}")
            return []

    async def update_admin_user_status(self, username: str, active: bool) -> bool:
        """Update admin user active status"""
        if not self.connected:
            return False

        try:
            result = await self.database.admin_users.update_one(
                {"username": username},
                {"$set": {"active": active, "updated_at": datetime.now().isoformat()}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating admin user status for {username}: {e}")
            return False
    
    # Admin user operations
    async def save_admin_user(self, username: str, user_data: Dict) -> bool:
        """Save or update an admin user"""
        if not self.connected:
            return False
            
        try:
            user_data["username"] = username
            user_data["updated_at"] = datetime.now().isoformat()
            
            await self.database.admin_users.replace_one(
                {"username": username},
                user_data,
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving admin user {username}: {e}")
            return False
    
    async def get_admin_user(self, username: str) -> Optional[Dict]:
        """Get an admin user by username"""
        if not self.connected:
            return None
            
        try:
            user = await self.database.admin_users.find_one({"username": username})
            return user
        except Exception as e:
            logger.error(f"Error getting admin user {username}: {e}")
            return None
    
    async def get_all_admin_users(self) -> List[Dict]:
        """Get all admin users"""
        if not self.connected:
            return []
            
        try:
            cursor = self.database.admin_users.find({})
            users = await cursor.to_list(length=None)
            return users
        except Exception as e:
            logger.error(f"Error getting all admin users: {e}")
            return []
    
    # Contact form operations
    async def save_contact_form(self, form_data: Dict) -> bool:
        """Save a contact form submission"""
        if not self.connected:
            return False
            
        try:
            form_data["created_at"] = datetime.now().isoformat()
            await self.database.contact_forms.insert_one(form_data)
            return True
        except Exception as e:
            logger.error(f"Error saving contact form: {e}")
            return False
    
    async def get_contact_forms(self) -> List[Dict]:
        """Get all contact form submissions"""
        if not self.connected:
            return []
            
        try:
            cursor = self.database.contact_forms.find({}).sort("created_at", -1)
            forms = await cursor.to_list(length=None)
            return forms
        except Exception as e:
            logger.error(f"Error getting contact forms: {e}")
            return []
    
    # Analytics operations
    async def get_analytics_data(self) -> Dict:
        """Get analytics data from the database"""
        if not self.connected:
            return {
                "conversation_metrics": {
                    "total_conversations": 0,
                    "completed_conversations": 0,
                    "completion_rate": 0,
                    "average_progress": 0,
                    "average_quality_score": 0
                },
                "lead_type_distribution": {"buying": 0, "selling": 0, "unknown": 0},
                "contact_form_submissions": 0
            }
        
        try:
            # Get conversation metrics
            total_conversations = await self.database.conversations.count_documents({})
            completed_conversations = await self.database.conversations.count_documents({"conversation_complete": True})
            
            # Calculate completion rate
            completion_rate = (completed_conversations / total_conversations * 100) if total_conversations > 0 else 0
            
            # Get lead type distribution
            buying_leads = await self.database.conversations.count_documents({
                "user_data.user_buying_or_selling": {"$regex": "buy", "$options": "i"}
            })
            selling_leads = await self.database.conversations.count_documents({
                "user_data.user_buying_or_selling": {"$regex": "sell", "$options": "i"}
            })
            unknown_leads = total_conversations - buying_leads - selling_leads
            
            # Get contact form count
            contact_forms = await self.database.contact_forms.count_documents({})
            
            return {
                "conversation_metrics": {
                    "total_conversations": total_conversations,
                    "completed_conversations": completed_conversations,
                    "completion_rate": completion_rate,
                    "average_progress": 0,  # Calculate if needed
                    "average_quality_score": 0  # Calculate if needed
                },
                "lead_type_distribution": {
                    "buying": buying_leads,
                    "selling": selling_leads,
                    "unknown": unknown_leads
                },
                "contact_form_submissions": contact_forms,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting analytics data: {e}")
            return {}

# Global MongoDB instance
mongodb = MongoDB()
