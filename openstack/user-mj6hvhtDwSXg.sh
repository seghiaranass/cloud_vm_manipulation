#!/bin/bash

export OS_AUTH_URL=https://auth.cloud.ovh.net/v3
export OS_IDENTITY_API_VERSION=3

export OS_USER_DOMAIN_NAME=${OS_USER_DOMAIN_NAME:-"Default"}
export OS_PROJECT_DOMAIN_NAME=${OS_PROJECT_DOMAIN_NAME:-"Default"}

export OS_TENANT_ID=6fed906e037c46829ab179c0307258b8
export OS_TENANT_NAME="5418784764202645"

export OS_USERNAME="user-mj6hvhtDwSXg"
export OS_PASSWORD=5KMpUNHh7zvWuhmnw4VMWbCmvafeh5ha

export OS_REGION_NAME=$region_

if [ -z "$OS_REGION_NAME" ]; then unset OS_REGION_NAME; fi

if openstack keypair show SSHKEY_2 >/dev/null 2>&1; then
  echo "SSH keypair SSHKEY_2 already exists."
else
  # Create SSH keypair
  openstack keypair create --public-key ~/.ssh/id_rsa.pub SSHKEY_2
  echo "SSH keypair SSHKEY_2 created."
fi

export OS_SSH_KEY_NAME="SSHKEY_2"
