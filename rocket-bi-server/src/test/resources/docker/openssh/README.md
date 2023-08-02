#### Generate the id_rsa file

```sh
ssh-keygen -t rsa -b 4096 -C "dev@rocket.bi" -P "123456" -f id_rsa -m pem
sudo chmod 600 id_rsa
```


#### Password of the id_rsa file in testing is `123456`
