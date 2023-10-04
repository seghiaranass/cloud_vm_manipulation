FROM node:19

WORKDIR /root/.ssh

COPY id_rsa.pub .

COPY id_rsa .

WORKDIR /app 

COPY package.json .

RUN npm install 

RUN apt update && apt upgrade -y 

RUN apt install python3-pip -y

RUN pip3 install --upgrade pip

RUN pip3 install python-openstackclient python-novaclient python-swiftclient

RUN openstack --help

RUN npm install multer && npm install readline
 
RUN npm install pm2 -g

# RUN pm2 link byxmkpsnnbynri2 luroogto4pp1fgq


RUN npm install

COPY . .

CMD ["pm2-runtime", "app.js"]