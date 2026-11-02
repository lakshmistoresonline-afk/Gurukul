import os
import sys
import json

print("==========================================================================")
print("GURUKUL AI — FIRESTORE USER INSPECTOR VIA FIREBASE ADMIN")
print("==========================================================================\n")

CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

def inspect_users():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Firebase Admin credentials not found at {CRED_PATH}")
        sys.exit(1)

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, auth
    except ImportError:
        print("firebase-admin package not installed. Installing / running check...")
        os.system(f"{sys.executable} -m pip install firebase-admin")
        import firebase_admin
        from firebase_admin import credentials, firestore, auth

    try:
        cred = credentials.Certificate(CRED_PATH)
        if not firebase_admin._apps:
            app = firebase_admin.initialize_app(cred)
        else:
            app = firebase_admin.get_app()

        db = firestore.client()
        print("Successfully connected to Firebase Firestore & Auth.")

        # Inspect Firestore collections
        collections = db.collections()
        col_names = [col.id for col in collections]
        print(f"Found Firestore collections: {col_names}")

        users_list = []
        # Check typical user collection names: 'users', 'User', 'profiles', etc.
        target_cols = ['users', 'User', 'profiles', 'Profiles', 'students', 'Students', 'accounts', 'Accounts']
        found_users_col = None

        for c_id in col_names:
            if c_id.lower() in [tc.lower() for tc in target_cols]:
                found_users_col = c_id
                break

        if found_users_col:
            print(f"Inspecting collection '{found_users_col}'...")
            docs = db.collection(found_users_col).stream()
            for doc in docs:
                u_data = doc.to_dict()
                u_data['id'] = doc.id
                users_list.append(u_data)
        else:
            # Fallback: stream all collections or list auth users
            print("No dedicated users collection found by standard names. Checking Firebase Auth...")
            try:
                page = auth.list_users()
                for user in page.users:
                    users_list.append({
                        "uid": user.uid,
                        "email": user.email,
                        "display_name": user.display_name,
                        "disabled": user.disabled
                    })
            except Exception as auth_err:
                print(f"Auth inspection error: {auth_err}")

        print(f"\n============================================================")
        print(f"RETRIEVED {len(users_list)} USERS:")
        print("============================================================\n")
        print(json.dumps(users_list, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")

if __name__ == "__main__":
    inspect_users()
