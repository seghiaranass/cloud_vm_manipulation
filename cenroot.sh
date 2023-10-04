#!/bin/bash

cd /home/centos 
mkdir test 

sudo cp /home/centos/.ssh/authorized_keys ~/.ssh/


# Backup the SSH server configuration file
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Edit the SSH server configuration file
sed -i 's/^\(PermitRootLogin\s*\).*$/\1yes/' /etc/ssh/sshd_config
sed -i 's/^\(PasswordAuthentication\s*\).*$/\1yes/' /etc/ssh/sshd_config

# Restart the SSH service
systemctl restart sshd



echo "root:@33@5@234ss" | chpasswd








