# Use the official Ubuntu 22 as a parent image
FROM ubuntu:22.04

# Set environment variables to make Python 3.10 as the default version
ENV PYTHONUNBUFFERED 1

# Install Python 3.10
RUN apt-get -y update && apt-get -y install software-properties-common \
&& add-apt-repository ppa:deadsnakes/ppa && apt install -y python3.10 \
git
# Install pip for Python 3.10
RUN apt-get install -y python3-pip

# fix to allow git clone in pip install to work
RUN git config --global url."https://".insteadOf git://

# Upgrade pip to the latest version
RUN python3.10 -m pip install --upgrade pip
# defaults to 0, 1 makes us use the shell env variables instead of .env file
ARG PRODUCTION=0 

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

EXPOSE 4000
# START uvicorn on port 4000
CMD bash -c "set -a && source .env && set +a && ./start_server.sh"
