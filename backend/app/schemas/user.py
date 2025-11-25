# from pydantic import BaseModel, EmailStr


# class UserBase(BaseModel):
#     email: EmailStr


# class UserCreate(UserBase):
#     password: str


# class User(UserBase):
#     id: int

#     class Config:
#         orm_mode = True

"""
    Here we will declare the actual objects
that backend use. This object is not the same 
with the one from the model.
"""