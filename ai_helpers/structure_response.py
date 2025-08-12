from google import genai
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()


class user_data(BaseModel):
    user_name: str
    user_phone_number: str
    user_email: str
    user_contact_preference: str
    user_buying_or_selling: str
    user_property_address: str
    user_property_type: str
    user_year_built: str
    user_square_footage: str
    user_number_of_bedrooms: str
    user_number_of_bathrooms: str
    user_lot_size: str
    user_recent_renovations_or_upgrades: str
    user_current_condition_assessment: str

def structure_response(history):
    prompt = f"history: {history}\ user: Get all the info of the user"
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL"),
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema":list[user_data]
        },
    )
    return response.text


