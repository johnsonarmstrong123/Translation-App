from database import SessionLocal, User

db = SessionLocal()
email = input("Enter the email of the user to make admin: ")

user = db.query(User).filter(User.email == email).first()
if user:
    user.is_admin = True
    db.commit()
    print(f"{email} is now an admin.")
else:
    print("User not found.")

db.close()