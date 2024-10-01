BASE_DIR := $(shell pwd)
DOCKER_CMD := docker
DOCKER_IMAGE_NAME := rapidly
HOST_PORT := 4000
CONTAINER_PORT := 4000
BACKEND_DIR := ./python_backend
MOUNTED_DIR := /mountedapp

prodbuild:
	$(DOCKER_CMD) build --build-arg PRODUCTION=1 --tag $(DOCKER_IMAGE_NAME) -f $(BACKEND_DIR)/Dockerfile .

build:
	$(DOCKER_CMD) build --no-cache --tag $(DOCKER_IMAGE_NAME) -f $(BACKEND_DIR)/Dockerfile .

# starts a persistent server (does not initialize the script)
startcontainer:
	$(eval DOCKER_CONT_ID := $(shell $(DOCKER_CMD) container run \
		-v $(BASE_DIR):$(MOUNTED_DIR) \
		-p 4000:4000 -p 80:80 \
		--privileged=true \
		-d --rm -t --privileged -i $(DOCKER_IMAGE_NAME) bash))
	echo $(DOCKER_CONT_ID) > status.current_container_id

# -p $(HOST_PORT):$(CONTAINER_PORT) \

# ssh's into an already running container
shell:
	$(eval DOCKER_CONT_ID := $(shell cat status.current_container_id | awk '{print $1}'))
	$(DOCKER_CMD) exec -it -w $(MOUNTED_DIR) $(DOCKER_CONT_ID) bash 

# starts the server in the already running container
shellrun:
	$(eval DOCKER_CONT_ID := $(shell cat status.current_container_id | awk '{print $1}'))
	$(DOCKER_CMD) exec -it -w $(MOUNTED_DIR)/python_backend $(DOCKER_CONT_ID) bash -c "set -a && source ../.env && set +a && ./start_server.sh"

# stops the persistent server (auto deleted)
stopcontainer:
	$(eval DOCKER_CONT_ID := $(shell cat status.current_container_id | awk '{print $1}'))
	$(DOCKER_CMD) stop $(DOCKER_CONT_ID)
	rm status.current_container_id

# runs the server in the container
run:
	$(DOCKER_CMD) container run --privileged=true --rm -t -p $(HOST_PORT):$(CONTAINER_PORT) -i $(DOCKER_IMAGE_NAME)
