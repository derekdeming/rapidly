# Info
All paths directed towards `/api/py/*` are now directed towards this fastapi endpoint instead. Configuration is located in `next.config.js`

# Setup
Install 3.11.4 pyenv (if you don't already have 3.11.4 pyenv installed)
```
pyenv install 3.11.4
```

Create virtualenv 
```
pyenv virtualenv 3.11.4 rapidly_fastapi_env
``` 

Activate pyenv 
```
pyenv activate rapidly_fastapi_env
```

To install dependencies, 
```
pip install requirements.txt
```

To start the server, 
```
./start_server.sh
```


export PYTHONPATH="/Users/derekdeming/cs_projects/knowledge_org/Platform/python_backend:$PYTHONPATH"
