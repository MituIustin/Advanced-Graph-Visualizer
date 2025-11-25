# from pydantic import BaseModel
# from typing import Any


# class GraphBase(BaseModel):
#     name: str
#     is_directed: bool = False
#     is_weighted: bool = False
#     data: Any  # dict nodes/edges


# class GraphCreate(GraphBase):
#     pass


# class GraphUpdate(GraphBase):
#     pass


# class Graph(GraphBase):
#     id: int
#     owner_id: int

#     class Config:
#         orm_mode = True

"""
    Here we will declare the actual objects
that backend use. This object is not the same 
with the one from the model.
"""