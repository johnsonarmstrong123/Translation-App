from database import SessionLocal, User
from auth import hash_password

db = SessionLocal()
email = input("Enter the email to reset: ")
new_password = input("Enter the new password: ")

user = db.query(User).filter(User.email == email).first()
if user:
    user.hashed_password = hash_password(new_password)
    db.commit()
    print(f"Password for {email} has been reset.")
else:
    print("User not found.")

db.close()