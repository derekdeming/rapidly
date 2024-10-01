from typing import Any, Callable

class DataEmitter():
    callbacks: list[Callable[[Any], None]]

    def __init__(self):
        self.callbacks = []
    
    def on(self, callback: Callable[[Any], None]):
        self.callbacks.append(callback)

    def emit(self, data: Any):
        for callback in self.callbacks:
            callback(data)

# Example Usage
# def listener(data):
#    print(data)
# 
# emitter = DataEmitter()
# emitter.on(listener)

# emitter.emit("Hello World")
        