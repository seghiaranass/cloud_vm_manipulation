
export OS_AUTH_URL=https://auth.cloud.ovh.net/v3
export OS_IDENTITY_API_VERSION=3

export OS_USER_DOMAIN_NAME=${OS_USER_DOMAIN_NAME:-"Default"}
export OS_PROJECT_DOMAIN_NAME=${OS_PROJECT_DOMAIN_NAME:-"Default"}


export OS_TENANT_ID=b2a18c2da58943e88a30940797f55094
export OS_TENANT_NAME="9161513878708266"

export OS_USERNAME="user-JJQBq653PM5B"

echo "Please enter your OpenStack Password: "
export OS_PASSWORD=9QFCUa9X7A7vURnQG45XMNUfDtWmRPcx

export OS_REGION_NAME=$region_
if [ -z "$OS_REGION_NAME" ]; then unset OS_REGION_NAME; fi
if openstack keypair show SSHKEY_2 >/dev/null 2>&1; then
  export OS_SSH_KEY_NAME="SSHKEY_2"
else
  openstack keypair create --public-key ~/.ssh/id_rsa.pub SSHKEY_2
  export OS_SSH_KEY_NAME=SSHKEY
  echo "SSH keypair SSHKEY created."
fi
