#!/bin/bash


export OS_AUTH_URL=https://auth.cloud.ovh.net/v3
export OS_IDENTITY_API_VERSION=3

export OS_USER_DOMAIN_NAME=${OS_USER_DOMAIN_NAME:-"Default"}
export OS_PROJECT_DOMAIN_NAME=${OS_PROJECT_DOMAIN_NAME:-"Default"}


export OS_TENANT_ID=58544ff246a3493a982243be2cfa6937
export OS_TENANT_NAME="3266814038556586"

export OS_USERNAME="user-Ntdegwhn66aJ"

echo "Please enter your OpenStack Password: "
export OS_PASSWORD=3mTJFSJyfVj7ZFxV2hAhWMkYbkPvA3d4

export OS_REGION_NAME=$region_

if [ -z "$OS_REGION_NAME" ]; then unset OS_REGION_NAME; fi

if openstack keypair show SSHKEY_2 >/dev/null 2>&1; then
  echo "SSH keypair SSHKEY_2 already exists."
else
  # Try to create SSH keypair
  if openstack keypair create --public-key ~/.ssh/id_rsa.pub SSHKEY_2 >/dev/null 2>&1; then
    echo "SSH keypair SSHKEY_2 created."
  else
    echo "SSH keypair SSHKEY_2 already exists."
  fi
fi

export OS_SSH_KEY_NAME="SSHKEY_2"
