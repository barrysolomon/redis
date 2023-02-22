FROM node:16.6.2-bullseye-slim

#update package list and install telnet
RUN apt update 
RUN apt install telnet -y 

# apt-get update && apt-get install telnet

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "index.js" ]