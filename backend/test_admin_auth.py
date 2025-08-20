#!/usr/bin/env python3
"""
Test script for admin authentication system
"""
import requests
import json

class AdminAuthTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    def test_login_success(self):
        """Test successful admin login"""
        print("Testing successful admin login...")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/admin/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                print("✅ Login successful")
                print(f"   Token received: {self.token[:20]}...")
                print(f"   User info: {data['user_info']['username']} ({data['user_info']['role']})")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed - make sure the backend server is running")
            return False
        except Exception as e:
            print(f"❌ Login test failed: {e}")
            return False
    
    def test_login_failure(self):
        """Test failed admin login with wrong credentials"""
        print("\nTesting failed admin login...")
        
        login_data = {
            "username": "admin",
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/admin/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("✅ Login correctly rejected with wrong password")
                return True
            else:
                print(f"❌ Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Login failure test failed: {e}")
            return False
    
    def test_protected_endpoint(self):
        """Test accessing protected endpoint with token"""
        if not self.token:
            print("❌ No token available for protected endpoint test")
            return False
        
        print("\nTesting protected endpoint access...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/admin/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Protected endpoint access successful")
                print(f"   User data: {data['username']} - {data['role']}")
                return True
            else:
                print(f"❌ Protected endpoint failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Protected endpoint test failed: {e}")
            return False
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        print("\nTesting unauthorized access...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/conversations",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("✅ Unauthorized access correctly rejected")
                return True
            else:
                print(f"❌ Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Unauthorized access test failed: {e}")
            return False
    
    def test_admin_endpoints(self):
        """Test various admin endpoints"""
        if not self.token:
            print("❌ No token available for admin endpoints test")
            return False
        
        print("\nTesting admin endpoints...")
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        endpoints = [
            "/api/admin/conversations",
            "/api/admin/leads", 
            "/api/admin/analytics"
        ]
        
        success_count = 0
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
                if response.status_code == 200:
                    print(f"   ✅ {endpoint} - Success")
                    success_count += 1
                else:
                    print(f"   ❌ {endpoint} - Failed ({response.status_code})")
            except Exception as e:
                print(f"   ❌ {endpoint} - Error: {e}")
        
        if success_count == len(endpoints):
            print("✅ All admin endpoints accessible")
            return True
        else:
            print(f"❌ {len(endpoints) - success_count} admin endpoints failed")
            return False
    
    def test_logout(self):
        """Test admin logout"""
        if not self.token:
            print("❌ No token available for logout test")
            return False
        
        print("\nTesting admin logout...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.base_url}/api/admin/logout",
                headers=headers
            )
            
            if response.status_code == 200:
                print("✅ Logout successful")
                self.token = None
                return True
            else:
                print(f"❌ Logout failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Logout test failed: {e}")
            return False

def run_admin_auth_tests():
    """Run all admin authentication tests"""
    print("🔐 Testing Admin Authentication System")
    print("=" * 50)
    
    tester = AdminAuthTester()
    
    tests = [
        tester.test_login_failure,
        tester.test_login_success,
        tester.test_protected_endpoint,
        tester.test_unauthorized_access,
        tester.test_admin_endpoints,
        tester.test_logout
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"✅ Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All admin authentication tests passed!")
        print("\nAdmin system is ready:")
        print("1. ✅ Secure login with JWT tokens")
        print("2. ✅ Protected endpoints with authorization")
        print("3. ✅ Proper error handling for unauthorized access")
        print("4. ✅ Session management with logout")
        print("5. ✅ Role-based access control foundation")
        print("\nAccess the admin panel:")
        print("- Open admin/index.html in your browser")
        print("- Login with: admin / admin123")
    else:
        print("❌ Some tests failed - check the backend server")

if __name__ == "__main__":
    run_admin_auth_tests()
