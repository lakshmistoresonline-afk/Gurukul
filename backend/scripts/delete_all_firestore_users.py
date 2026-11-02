import os
import sys

print("==========================================================================")
print("GURUKUL AI — DELETE ALL FIRESTORE USERS")
print("==========================================================================\n")

CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

def delete_all_users():
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
            app = firebase_admin.initialize_app(cred)
        else:
            app = firebase_admin.get_app()

        db = firestore.client()
        print("Connected to Firebase Firestore.")

        # 1. Delete documents from 'users' collection
        users_ref = db.collection('users')
        docs = list(users_ref.stream())
        deleted_firestore_count = 0

        print(f"Found {len(docs)} documents in 'users' collection. Deleting...")
        for doc in docs:
            # Delete auth user if uid matches doc id
            uid = doc.id
            try:
                auth.delete_user(uid)
                print(f"  Deleted Auth user: {uid}")
            except Exception as auth_err:
                print(f"  Auth user delete note for {uid}: {auth_err}")

            doc.reference.delete()
            print(f"  Deleted Firestore doc: {uid}")
            deleted_firestore_count += 1

        print(f"\nSuccessfully deleted {deleted_firestore_count} users from Firestore and Auth.")

    except Exception as e:
        print(f"Error deleting users: {e}")

if __name__ == "__main__":
    delete_all_users()
