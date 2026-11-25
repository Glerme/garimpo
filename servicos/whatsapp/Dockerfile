FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ENV WHATSAPP_HOST=0.0.0.0
EXPOSE 4320
CMD ["npm", "start"]
