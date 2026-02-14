FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install
COPY . .
