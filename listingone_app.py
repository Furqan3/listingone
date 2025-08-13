#!/usr/bin/env python3

# Check Gradio version first
try:
    import gradio as gr
    print(f"Gradio version: {gr.__version__}")
except ImportError:
    print("Gradio not installed. Please run: pip install gradio>=4.0.0")
    exit(1)

import json
import os
import sys
from datetime import datetime

# Add current directory to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ai_helpers.chat_respose import chat_response
    from ai_helpers.structure_response import structure_response
except ImportError as e:
    print(f"Error importing AI helpers: {e}")
    print("Make sure ai_helpers module is in the correct path")
    exit(1)

class ListingOneChat:
    def __init__(self):
        self.history = {}
        self.user_data = {}
        self.conversation_phase = "initial"
        self.lead_qualified = False
        
    def chat_interface(self, message, chat_history):
        """Main chat interface function"""
        if message.strip() == "":
            return chat_history, ""
        
        # Get AI response
        try:
            ai_response = chat_response(self.history, message)
            
            # Update chat history for display (using messages format)
            if chat_history is None:
                chat_history = []
            
            # Add user message and AI response in messages format
            chat_history.append({"role": "user", "content": message})
            chat_history.append({"role": "assistant", "content": ai_response})
            
            # Check if we should extract user data
            self.check_for_data_extraction()
            
            return chat_history, ""
            
        except Exception as e:
            error_msg = f"Sorry, there was an error: {str(e)}"
            if chat_history is None:
                chat_history = []
            chat_history.append({"role": "user", "content": message})
            chat_history.append({"role": "assistant", "content": error_msg})
            return chat_history, ""
    
    def check_for_data_extraction(self):
        """Check if enough conversation has happened to extract user data"""
        if len(self.history) > 6:  # Only try extraction after some conversation
            try:
                structured_data = structure_response(self.history)
                if structured_data:
                    self.user_data = json.loads(structured_data)
            except:
                pass  # Continue if extraction fails
    
    def get_user_data(self):
        """Return formatted user data"""
        if not self.user_data:
            try:
                structured_data = structure_response(self.history)
                if structured_data:
                    self.user_data = json.loads(structured_data)
            except:
                return "No user data collected yet. Continue the conversation to gather lead information."
        
        if self.user_data:
            formatted_data = "## Collected User Data:\n\n"
            for item in self.user_data:
                for key, value in item.items():
                    if value and value.strip():  # Only show non-empty values
                        formatted_key = key.replace('user_', '').replace('_', ' ').title()
                        formatted_data += f"**{formatted_key}:** {value}\n\n"
            return formatted_data
        return "No user data collected yet."
    
    def export_lead_data(self):
        """Export lead data as JSON file"""
        if not self.user_data:
            try:
                structured_data = structure_response(self.history)
                if structured_data:
                    self.user_data = json.loads(structured_data)
            except:
                return None
        
        if self.user_data:
            # Add timestamp
            export_data = {
                "timestamp": datetime.now().isoformat(),
                "conversation_history": self.history,
                "structured_data": self.user_data
            }
            
            # Create filename with timestamp
            filename = f"lead_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Write to file
            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            return filename
        return None
    
    def reset_conversation(self):
        """Reset the conversation"""
        self.history = {}
        self.user_data = {}
        self.conversation_phase = "initial"
        self.lead_qualified = False
        return None, "Conversation reset. Start a new conversation!", ""

# Initialize the chat instance
chat_instance = ListingOneChat()

# Custom CSS for branding
custom_css = """
.gradio-container {
    font-family: 'Arial', sans-serif;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    text-align: center;
    color: white;
    margin-bottom: 20px;
    border-radius: 10px;
}

.stats-box {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
    margin: 10px 0;
}

.export-btn {
    background: #28a745 !important;
    border-color: #28a745 !important;
}

.reset-btn {
    background: #dc3545 !important;
    border-color: #dc3545 !important;
}
"""

# Create the Gradio interface
def create_interface():
    # Check if gr.Blocks exists (Gradio 3.x vs 4.x compatibility)
    if not hasattr(gr, 'Blocks'):
        print("Error: This requires Gradio 4.x. Please update with: pip install gradio>=4.0.0")
        exit(1)
    
    with gr.Blocks(css=custom_css, title="ListingOne.ai Assistant") as demo:
        
        # Header
        gr.HTML("""
        <div class="header">
            <h1>🏠 ListingOne.ai Assistant</h1>
            <p>Your AI-powered real estate lead generation assistant</p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=2):
                # Main chat interface
                gr.Markdown("## 💬 Chat with Assistant")
                chatbot = gr.Chatbot(
                    height=500,
                    label="ListingOne.ai Assistant",
                    placeholder="Start your conversation here...",
                    type="messages"
                )
                
                with gr.Row():
                    msg_input = gr.Textbox(
                        placeholder="Type your message here...",
                        label="",
                        lines=1,
                        scale=4
                    )
                    send_btn = gr.Button("Send 📤", variant="primary", scale=1)
                
                # Control buttons
                with gr.Row():
                    reset_btn = gr.Button("🔄 Reset Conversation", variant="secondary")
                    export_btn = gr.Button("📥 Export Lead Data", variant="primary")
            
            with gr.Column(scale=1):
                # User data display
                gr.Markdown("## 📊 Lead Information")
                user_data_display = gr.Markdown(
                    value="No conversation started yet.",
                    label="Collected Data"
                )
                
                # Stats
                gr.HTML("""
                <div class="stats-box">
                    <h4>📈 Conversation Stats</h4>
                    <p><strong>Status:</strong> Ready to collect leads</p>
                    <p><strong>Data Quality:</strong> Real-time extraction</p>
                    <p><strong>Export:</strong> JSON format available</p>
                </div>
                """)
                
                # Instructions
                gr.Markdown("""
                ### 📋 Instructions:
                1. **Start the conversation** - The AI will collect contact info first
                2. **Follow the flow** - Name → Email → Phone → Property details
                3. **Monitor data collection** - See extracted info in real-time
                4. **Export leads** - Download structured data when ready
                5. **Reset** - Clear conversation to start fresh
                
                ### 🎯 Lead Collection Goals:
                - ✅ Contact Information (Name, Email, Phone)
                - ✅ Lead Type (Buyer/Seller)
                - ✅ Property Details
                - ✅ Timeline & Preferences
                """)
        
        # Event handlers
        def send_message(message, history):
            new_history, _ = chat_instance.chat_interface(message, history)
            user_data = chat_instance.get_user_data()
            return new_history, "", user_data
        
        def reset_chat():
            chat_history, message, _ = chat_instance.reset_conversation()
            return chat_history, message, "Conversation reset. Ready for new leads!"
        
        def export_data():
            filename = chat_instance.export_lead_data()
            if filename:
                return f"✅ Lead data exported to: {filename}"
            return "❌ No data to export yet. Continue the conversation first."
        
        # Connect events
        send_btn.click(
            send_message, 
            inputs=[msg_input, chatbot], 
            outputs=[chatbot, msg_input, user_data_display]
        )
        
        msg_input.submit(
            send_message, 
            inputs=[msg_input, chatbot], 
            outputs=[chatbot, msg_input, user_data_display]
        )
        
        reset_btn.click(
            reset_chat,
            outputs=[chatbot, msg_input, user_data_display]
        )
        
        export_btn.click(
            export_data,
            outputs=[gr.Textbox(label="Export Status", visible=False)]
        )
        
        # Remove the problematic auto-update for now
        # Auto-update can be added back with a different approach if needed
        
    return demo

# Launch the interface
if __name__ == "__main__":
    # Check if required environment variables are set
    required_vars = ["GEMINI_API_KEY", "GEMINI_MODEL", "SYSTEM_PROMPT_PATH"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file before running.")
        exit(1)
    
    demo = create_interface()
    demo.launch(
        server_name="0.0.0.0",  # Allow external access
        server_port=7860,       # Default Gradio port
        share=True,             # Create shareable link
        debug=True              # Enable debug mode
    )
    