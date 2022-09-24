## SETUP SENDGRID MAIL

1. Add all of these records to CloudFlare DNS section.

| TYPE   |      DNS NAME      |  CANONICAL NAME |
|----------|:-------------|------:|
| CNAME |  em1360.dev.datainsider.co | u19527549.wl050.sendgrid.net |
| CNAME |    s1._domainkey.dev.datainsider.co   |   s1.domainkey.u19527549.wl050.sendgrid.net |
| CNAME | s2._domainkey.dev.datainsider.co |    s2.domainkey.u19527549.wl050.sendgrid.net |

2. Done

## Organization

### register new organization

sau khi register, organization sẽ chưa được tạo ngay, người dùng sẽ nhận đc một email để kích hoạt organization trong
email sẽ có 1 đường dẫn gọi vào api activation với một `activation_token`

field `sub_domain_name` sẽ là field unique giữa các organization nên nếu đã tồn tại một sub domain thì api sẽ trả về
code 400

field `re_captcha_token` là sau khi thực hiện bước verify bằng reCapcha v2 Checkbox:
(`https://developers.google.com/recaptcha/docs/display` phần v2 Checkbox)

- Method: `POST`
- Endpoint: `/organizations`
- Example Curl's request:

```shell
curl --request POST \
  --url https://dev.datainsider.co/api/organizations \
  --header 'Content-Type: application/json' \
  --data '{
  "first_name" : "Leonel",
  "last_name" : "Messi",
  "work_email" : "nkt165@gmail.com",
	"admin_password": "123456",
  "phone_number" : "123123123",
  "company_name" : "PSG",
    "sub_domain_name": "psg",
    "re_captcha_token": "abc-123"
}'
```

- Example response:

```json
{
  "success": true,
  "activation_token": "7uguf8lsr0a62na3gfjgufc5"
}
```

### activate registered organization

- Method: `GET`
- Endpoint: `/organizations/activate/:activation_token`
- Example Curl's request:

```shell
curl --request GET \
  --url https://dev.datainsider.co/api/organizations/activate/7uguf8lsr0a62na3gfjgufc5 \
  --header 'Content-Type: application/json'
```

- Example response:
```json
{
  "organization_id": 4,
  "owner": "gg-104751364871936070295",
  "name": "PSG",
  "domain": "psg.datainsider.co",
  "is_active": true,
  "created_time": 1629528137444
}
```