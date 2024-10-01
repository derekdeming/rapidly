FROM python:3.10
# defaults to 0, 1 makes us use the shell env variables instead of .env file
ARG PRODUCTION=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    poppler-utils \
    libpoppler-cpp-dev \
    libpoppler-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./python_backend .env* .

RUN python3 --version

RUN pip install -r requirements.txt

RUN prisma generate

# Copy the shell env variables into .env to keep rest of the code the same
RUN if [ "$PRODUCTION" = "1" ]; then env > .env; fi

# initialize env variables
RUN export $(cat .env | xargs)

EXPOSE 80
EXPOSE 4000
# START uvicorn on port 4000
CMD hypercorn main:app --workers 4 --error-logfile - --bind [::]:$PORT
