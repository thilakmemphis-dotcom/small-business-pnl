# Stage 1: Build frontend with Node
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python API + static files
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend
COPY --from=frontend /app/dist ./dist

# Copy Python server
COPY server ./server

ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-3001}"]
