# Vercel to MySQL Access Fix

When MySQL shows an error like:

```text
Access denied for user 'user'@'ec2-...compute.amazonaws.com'
```

the app is not trying to connect to that EC2 hostname. MySQL is reporting the incoming client host. On Vercel, serverless functions run on AWS infrastructure with dynamic outbound IP addresses, so the database sees an AWS/EC2 host and rejects it if the MySQL user or firewall only allows `localhost` or a fixed host.

## Required Vercel Environment Variable

Set `DATABASE_URL` in Vercel:

```text
mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME
```

Do not commit `.env`, `.env.production`, or copied env files to Git.

## MySQL User Host Permission

On the MySQL server, create or update a user that can connect from remote hosts:

```sql
CREATE USER IF NOT EXISTS 'dm_app'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON dmconsultant_mydmcons_dm.*
TO 'dm_app'@'%';
FLUSH PRIVILEGES;
```

If the user already exists only as `'dm_app'@'localhost'`, that account does not cover Vercel. Add the `'%'` host entry or a more specific remote host pattern supported by your infrastructure.

## Firewall / Security Group

Allow inbound TCP traffic to MySQL, usually port `3306`, from Vercel.

For standard Vercel serverless deployments, outbound IPs are dynamic, so a single static IP allowlist is not reliable. Practical options:

- Allow `0.0.0.0/0` to port `3306`, but require a strong DB password and least-privilege DB user.
- Use a serverless-friendly database proxy or tunnel.
- Use Vercel features or a hosting setup that provides static egress IPs, if available for your plan.

## Quick Verification

After changing MySQL grants and firewall rules:

1. Redeploy or restart the Vercel deployment.
2. Check the Vercel function logs.
3. If the error changes from `Access denied for user ...@ec2...` to another database error, the network/user-host rejection is resolved and the next issue is application/schema-specific.

## Security Notes

- Do not use the MySQL `root` user from Vercel.
- Do not grant `ALL PRIVILEGES` unless absolutely required.
- Keep production credentials only in Vercel Environment Variables.
- Rotate any credentials that were ever committed to Git.
