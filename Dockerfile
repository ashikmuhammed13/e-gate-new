# Use an official Node.js image (Debian Buster)
FROM node:16-buster

# Install Chromium and required libraries
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
  && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use the system-installed Chromium.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create and set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port your server listens on (adjust as needed)
EXPOSE 7000

# Start your server (adjust the command as needed)
CMD ["npm", "start"]
