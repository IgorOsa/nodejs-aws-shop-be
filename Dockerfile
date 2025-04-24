# Use official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy the application code
COPY ./backend/src/bff-service .

RUN npm install dotenv

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable for Elastic Beanstalk
ENV PORT=3000
ENV NODE_ENV=develop

# Start the application
CMD ["node", "index.js"]
