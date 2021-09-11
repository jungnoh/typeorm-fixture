test: build_test_image
	docker run typeorm-fixture-test

build_test_image:
	docker build . --tag typeorm-fixture-test