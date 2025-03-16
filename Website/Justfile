demo:
	bun --bun run dev

transfer:
	rsync -avPh \
		--exclude node_modules \
		--exclude dist \
		--exclude .git \
		. napat@muhsic.acad.ucsc.edu:~/corpus
	
deploy:
	docker compose up -d --build
