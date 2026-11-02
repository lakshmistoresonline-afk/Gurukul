import os
import sys

print("==========================================================================")
print("GURUKUL AI — CREATE CUSTOM USERS (AUTH & FIRESTORE)")
print("==========================================================================\n")

CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

CUSTOM_USERS = [
    {
        "name": "Admin",
        "email": "admin@gurukul.com",
        "classId": "all",
        "role": "admin",
        "password": "Gurukul@123"
    },
    {
        "name": "Srisha T S",
        "email": "tssrisha2015@gmail.com",
        "classId": "6",
        "role": "student",
        "password": "Gurukul@123"
    },
    {
        "name": "Srinav T S",
        "email": "srinavts2016@gmail.com",
        "classId": "5",
        "role": "student",
        "password": "Gurukul@123"
    }
]

def create_users():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Firebase Admin credentials not found at {CRED_PATH}")
        sys.exit(1)

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, auth
    except ImportError:
        print("firebase-admin package not installed.")
        sys.exit(1)

    try:
        cred = credentials.Certificate(CRED_PATH)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.get_app()

        db = firestore.client()
        print("Connected to Firebase Firestore & Auth.")

        for u in CUSTOM_USERS:
            email = u["email"]
            name = u["name"]
            class_id = u["classId"]
            role = u["role"]
            password = u["password"]

            uid = None
            try:
                existing_user = auth.get_user_by_email(email)
                uid = existing_user.uid
                auth.update_user(uid, password=password, display_name=name)
                print(f"Updated existing Auth user: {email} (UID: {uid})")
            except:
                new_user = auth.create_user(
                    email=email,
                    password=password,
                    display_name=name
                )
                uid = new_user.uid
                print(f"Created new Auth user: {email} (UID: {uid})")

            user_doc_ref = db.collection('users').document(uid)
            user_doc_ref.set({
                "uid": uid,
                "name": name,
                "email": email,
                "classId": class_id,
                "role": role,
                "badges": [],
                "xp": 100,
                "createdAt": firestore.SERVER_TIMESTAMP
            }, merge=True)
            print(f"  Synced Firestore doc for {name} (Class: {class_id}, Role: {role})")

        print("\nSuccessfully created and synchronized all requested users in Firebase Auth & Firestore!")

    except Exception as e:
        print(f"Error creating users: {e}")

if __name__ == "__main__":
    create_users()
