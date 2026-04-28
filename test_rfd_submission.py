"""
Test RFD form submission to verify email sending
"""
import requests
import json

# RFD submission data (REPLACE WITH YOUR TEST DATA)
data = {
    "company": "Test Company Inc",
    "contactPerson": "John Doe",
    "email": "test@example.com",
    "phone": "555-0123",
    "products": ["Cloud Infrastructure Solutions", "Enterprise Security Suite"],
    "message": "I would like to schedule a demo for these products.",
    "budget": "$10,000 - $50,000",
    "session_id": None
}

print("=" * 60)
print("Testing RFD Form Submission")
print("=" * 60)
print(f"Company: {data['company']}")
print(f"Contact: {data['contactPerson']}")
print(f"Email: {data['email']}")
print(f"Phone: {data['phone']}")
print(f"Products: {', '.join(data['products'])}")
print("=" * 60)

# Submit to backend
url = "http://localhost:8000/leads/submit-rfd"
headers = {"Content-Type": "application/json"}

print(f"\nSending POST request to {url}...")

try:
    response = requests.post(url, json=data, headers=headers)

    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        print("\n✓ SUCCESS! RFD form submitted successfully!")
        print(f"\nCheck the following:")
        print(f"1. Backend logs for email sending confirmation")
        print(f"2. Email inbox: {data['email']}")
        print(f"3. Admin email inbox for admin alert")
    else:
        print(f"\n✗ ERROR: Form submission failed with status {response.status_code}")

except requests.exceptions.ConnectionError:
    print("\n✗ ERROR: Could not connect to backend server!")
    print("Make sure the backend is running on http://localhost:8000")
except Exception as e:
    print(f"\n✗ ERROR: {str(e)}")
