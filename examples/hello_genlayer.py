# Simple Hello GenLayer Contract
# This is a beginner-friendly example for GenLayer Boilerplate

from genlayer import *

class HelloGenLayer(gl.Contract):
    message: str

    def __init__(self):
        self.message = "Hello GenLayer!"

    @gl.public.view
    def get_message(self) -> str:
        return self.message

    @gl.public.write
    def set_message(self, new_message: str):
        self.message = new_message
