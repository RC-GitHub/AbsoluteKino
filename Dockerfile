FROM node:20-slim

WORKDIR /app

# In case SQLite needs to compile binaries
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Ensuring the SQLite files exist with right permissions
RUN touch db.sqlite test.sqlite && chmod 666 db.sqlite test.sqlite

EXPOSE 3000

CMD ["npm", "start"]
