FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Use npm ci for reproducible builds, omit dev dependencies
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "src/server.js"]
