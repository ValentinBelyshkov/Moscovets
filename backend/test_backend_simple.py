#!/usr/bin/env python3
"""
Simple test script to check if the backend can start properly
"""

import sys
import os
import traceback

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing module imports...")
    
    modules_to_test = [
        ("fastapi", "FastAPI"),
        ("fastapi.middleware.cors", "CORSMiddleware"),
        ("sqlalchemy", "create_engine"),
        ("uvicorn", "run"),
        ("pydantic", "BaseModel"),
        ("app.core.config", "settings"),
        ("app.api.v1.api", "api_router"),
        ("app.middleware.logging_middleware", "LoggingMiddleware"),
        ("app.exceptions.handlers", "setup_exception_handlers"),
    ]
    
    for module_path, attr in modules_to_test:
        try:
            if attr:
                module = __import__(module_path, fromlist=[attr])
                getattr(module, attr)
                print(f"[OK] Successfully imported {module_path}.{attr}")
            else:
                __import__(module_path)
                print(f"[OK] Successfully imported {module_path}")
        except Exception as e:
            print(f"[FAIL] Failed to import {module_path}: {e}")
            return False
    
    return True

def test_config():
    """Test that configuration loads correctly"""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import settings
        print(f"[OK] Configuration loaded: {settings.PROJECT_NAME}")
        
        # Test CORS origins parsing
        origins = settings.get_cors_origins()
        print(f"[OK] CORS origins parsed: {len(origins)} origins found")
        print(f"  Origins: {origins[:3]}{'...' if len(origins) > 3 else ''}")
        
        # Test database URL
        print(f"[OK] Database URL: {settings.DATABASE_URL.replace('moskovets3d', '***')}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Configuration test failed: {e}")
        traceback.print_exc()
        return False

def test_app_creation():
    """Test that FastAPI app can be created"""
    print("\nTesting FastAPI app creation...")
    
    try:
        from app.main import app
        print(f"[OK] FastAPI app created: {app.title}")
        
        # Test that routes are registered
        route_paths = [route.path for route in app.routes]
        print(f"[OK] Routes registered: {len(route_paths)} routes")
        
        # Check for important routes
        if "/" in route_paths:
            print("  [OK] Root route exists")
        if "/health" in route_paths:
            print("  [OK] Health check route exists")
            
        return True
    except Exception as e:
        print(f"[FAIL] App creation test failed: {e}")
        traceback.print_exc()
        return False

def main():
    print("Running backend startup tests...\n")
    
    tests = [
        ("Module Imports", test_imports),
        ("Configuration", test_config),
        ("App Creation", test_app_creation),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
            print(f"[OK] {test_name} PASSED")
        else:
            print(f"[FAIL] {test_name} FAILED")
    
    print(f"\n--- Summary ---")
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("[OK] All tests passed! Backend should start successfully.")
        return True
    else:
        print("[FAIL] Some tests failed. There may be issues with the backend.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)