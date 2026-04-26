# Base image
FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3100

# Start script: Run migrations and then start the app
CMD npx prisma db push && npm run start:prod
