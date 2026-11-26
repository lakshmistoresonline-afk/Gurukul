import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path("D:/GURUKUL/backend")))

import firebase_admin
from firebase_admin import credentials, auth, firestore

ACCOUNTS = [
    {"email": "student5@test.com", "password": "Test@123", "displayName": "Student Class 5", "classId": "5", "role": "student"},
    {"email": "student6@test.com", "password": "Test@123", "displayName": "Student Class 6", "classId": "6", "role": "student"},
    {"email": "student7@test.com", "password": "Test@123", "displayName": "Student Class 7", "classId": "7", "role": "student"},
    {"email": "student8@test.com", "password": "Test@123", "displayName": "Student Class 8", "classId": "8", "role": "student"},
    {"email": "student9@test.com", "password": "Test@123", "displayName": "Student Class 9", "classId": "9", "role": "student"},
    {"email": "student10@test.com", "password": "Test@123", "displayName": "Student Class 10", "classId": "10", "role": "student"},
    {"email": "admin@gurukul.com", "password": "Admin@123", "displayName": "System Admin", "classId": "all", "role": "admin"}
]

print("Initializing Firebase Admin SDK for Account Provisioning...")

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_admin._apps:
    try:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    except Exception as e:
        print(f"CRITICAL ERROR: Firebase Admin SDK initialization failed: {e}")
        sys.exit(1)

try:
    db = firestore.client()
    provisioned_count = 0

    for acc in ACCOUNTS:
        email = acc["email"]
        uid = None

        # 1. Fetch or Create Firebase Auth User
        try:
            user_record = auth.get_user_by_email(email)
            uid = user_record.uid
            print(f"[Auth] Account {email} verified in Firebase Auth (UID: {uid}).")
        except auth.UserNotFoundError:
            try:
                user_record = auth.create_user(
                    email=email,
                    password=acc["password"],
                    display_name=acc["displayName"]
                )
                uid = user_record.uid
                print(f"[Auth] Created new Firebase Auth account {email} (UID: {uid}).")
            except Exception as create_err:
                print(f"CRITICAL ERROR: Failed to create Firebase Auth user {email}: {create_err}")
                sys.exit(1)
        except Exception as auth_err:
            print(f"CRITICAL ERROR: Failed to verify Firebase Auth user {email}: {auth_err}")
            sys.exit(1)

        if not uid:
            print(f"CRITICAL ERROR: Unable to resolve UID for {email}.")
            sys.exit(1)

        # 2. Update Firestore User Document
        try:
            doc_ref = db.collection("users").document(uid)
            doc_ref.set({
                "uid": uid,
                "email": email,
                "displayName": acc["displayName"],
                "classId": acc["classId"],
                "role": acc["role"],
                "accountStatus": "active",
                "updatedAt": firestore.SERVER_TIMESTAMP
            }, merge=True)
            print(f"[Firestore] Profile set for {email} (Class: {acc['classId']}, Role: {acc['role']}).")
            provisioned_count += 1
        except Exception as fs_err:
            print(f"CRITICAL ERROR: Failed to write Firestore profile for {email} (UID: {uid}): {fs_err}")
            sys.exit(1)

    print(f"SUCCESS: Idempotent account provisioning completed. {provisioned_count}/{len(ACCOUNTS)} accounts active in Firebase Auth and Firestore.")
    sys.exit(0)

except Exception as global_err:
    print(f"CRITICAL ERROR: Unhandled exception during account provisioning: {global_err}")
    sys.exit(1)
