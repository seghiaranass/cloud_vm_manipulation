
export OS_AUTH_URL=https://auth.cloud.ovh.net/v3
export OS_IDENTITY_API_VERSION=3

export OS_USER_DOMAIN_NAME=${OS_USER_DOMAIN_NAME:-"Default"}
export OS_PROJECT_DOMAIN_NAME=${OS_PROJECT_DOMAIN_NAME:-"Default"}


export OS_TENANT_ID=bf01a307062f4c54b7c65f3846d55369
export OS_TENANT_NAME="1790771352513284"

export OS_USERNAME="user-VpZuAM8bdmDT"

echo "Please enter your OpenStack Password: "
export OS_PASSWORD=fBTJ4Gc6ZaW4fnUDPCHV6fmVF4ujTtFv

export OS_REGION_NAME=$region_
if [ -z "$OS_REGION_NAME" ]; then unset OS_REGION_NAME; fi
if openstack keypair show SSHKEY_2 >/dev/null 2>&1; then
  export OS_SSH_KEY_NAME="SSHKEY_2"
else
  openstack keypair create --public-key ~/.ssh/id_rsa.pub SSHKEY_2
  export OS_SSH_KEY_NAME=SSHKEY
  echo "SSH keypair SSHKEY created."
fi
