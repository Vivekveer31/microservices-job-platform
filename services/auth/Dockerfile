FROM node:20

WORKDIR /app

COPY package*.json ./
RUN  npm ci

COPY . .

# Build TypeScript → dist/
RUN npm run build

EXPOSE 8000

CMD ["node", "dist/index.js]
