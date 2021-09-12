test: build_test_image 
	docker-compose up --abort-on-container-exit

build_test_image:
	docker build . --tag typeorm-fixture-test